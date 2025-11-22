import crypto from "crypto";
import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketService } from "./WebSocketServer.js";
import { ApiRouter } from "./ApiRoutes.js";
import { setupSecurity } from "./middleware/security.js";
import { setupSession } from "./middleware/session.js";
import { AuthController } from "./controllers/AuthController.js";
import { AppError } from "../application/errors.js";
import logger from "../utils/logger.js";
import pinoHttp from "pino-http";
import { LeaderboardService } from "../services/LeaderboardService.js";

import AppEvents, { EVENTS } from "../application/events.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  private config: any;
  private app: Express;
  private server: Server;
  private wsService: WebSocketService | null;
  private authController: AuthController;
  private leaderboardService: LeaderboardService;
  private apiRouter: ApiRouter;

  constructor({
    config,
    authController,
    leaderboardService,
    apiRouter,
  }: {
    config: any;
    authController: AuthController;
    leaderboardService: LeaderboardService;
    apiRouter: ApiRouter;
  }) {
    this.config = config;
    this.authController = authController;
    this.leaderboardService = leaderboardService;
    this.apiRouter = apiRouter;
    this.app = express();
    this.server = createServer(this.app);
    this.wsService = null;
  }

  initialize() {
    this.app.set("trust proxy", 1);

    // Security middleware (CSP, CORS, essential headers)
    setupSecurity(this.app);

    // HTTP request logging
    this.app.use(
      pinoHttp({
        logger,
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const id = req.headers["x-request-id"];
          if (typeof id === "string") return id;
          if (Array.isArray(id)) return id[0];
          return crypto.randomUUID();
        },
        // pino-http@9: signature (req, res, err)
        customLogLevel: (
          req: IncomingMessage,
          res: ServerResponse,
          err?: Error
        ) => {
          if (err || (res.statusCode && res.statusCode >= 500)) return "error";
          if (res.statusCode && res.statusCode >= 400) return "warn";
          return "info";
        },
      })
    );

    // Static files
    this.setupStaticFiles();

    // Session management
    setupSession(this.app, this.config);

    // WebSocket setup
    this.wsService = new WebSocketService(this.server, "/wss", {
      leaderboardService: this.leaderboardService,
      enablePolling: false,
    });

    // Leaderboard updates via AppEvents
    this.setupLeaderboardEvents();

    // View engine
    this.setupTemplateEngine();

    // API routes
    this.apiRouter.setup(this.app);

    // Centralized error handler (last)
    // eslint-disable-next-line no-unused-vars
    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof AppError) {
          logger.warn({ err }, "AppError");
          return res
            .status(err.status)
            .json({ error: err.message, code: err.code });
        }
        logger.error({ err }, "Unhandled error");
        res.status(500).json({ error: "Internal Server Error" });
      }
    );

    this.setupRoutes();

    // Контроллер аутентификации
    this.authController.setupRoutes(this.app);

    return this;
  }

  setupStaticFiles() {
    this.app.use("/static", express.static(path.join(__dirname, "../public")));
    this.app.use("/js", express.static(path.join(__dirname, "public/js")));
    this.app.use(
      "/media",
      express.static(path.join(__dirname, "public/media"))
    );
  }

  setupLeaderboardEvents() {
    AppEvents.on(EVENTS.LEADERBOARD_CHANGED, async () => {
      if (this.wsService) {
        const changed = await this.wsService.updateLeaderboardHash();
        if (changed) {
          this.wsService.broadcastData({ leaderboardChanged: true });
        }
      }
    });
  }

  setupTemplateEngine() {
    this.app.engine("html", async (filePath, options, callback) => {
      try {
        let content = await Bun.file(filePath).text();

        // Заменяем маркеры на содержимое шаблонов
        if (content.includes("<!-- INCLUDE_NAVIGATION -->")) {
          const navPath = path.join(
            __dirname,
            "views/partials/navigation.html"
          );

          try {
            const navFile = Bun.file(navPath);
            if (await navFile.exists()) {
              const navContent = await navFile.text();
              content = content.replace(
                "<!-- INCLUDE_NAVIGATION -->",
                navContent
              );
            } else {
              logger.warn({ navPath }, `Navigation partial not found`);
            }
          } catch (err) {
            logger.error({ err }, `Error reading navigation.html`);
          }
        }

        callback(null, content);
      } catch (err: any) {
        logger.error({ err, filePath }, `Error reading template file`);
        return callback(err);
      }
    });

    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "html");
  }

  setupRoutes() {
    // Views
    this.app.get("/", (req, res) => res.render("index"));
    this.app.get("/catDetails", (req, res) => res.render("catDetails"));
    this.app.get("/similar", (req, res) => res.render("similar"));

    // Health checks
    this.app.get("/healthz", (req, res) =>
      res.status(200).json({ status: "ok" })
    );
    this.app.get("/readyz", (req, res) =>
      res.status(200).json({ status: "ready" })
    );

    // User profile view (requires session)
    this.app.get("/profile", (req, res) => {
      if (!(req.session as any).user) {
        return res.redirect("/login");
      }
      res.render("profile");
    });

    // Login page
    this.app.get("/login", (req, res) => {
      if ((req.session as any).user) {
        return res.redirect("/profile");
      }
      res.render("login");
    });

    // Logout
    this.app.get("/logout", (req, res) => {
      req.session.destroy((err) => {
        if (err) logger.error({ err }, "Session destroy error");
        res.redirect("/");
      });
    });
  }

  start() {
    const port = this.config.expressServerPort;

    return new Promise((resolve) => {
      this.server.listen(port, () => {
        // Получаем базовый URL без слеша в конце
        const baseUrl = (
          this.config.FULL_WEBSITE_URL ||
          this.config.WEBSITE_URL ||
          `http://localhost:${port}`
        ).replace(/\/$/, "");

        logger.info({ port }, `Server is running on port ${port}`);
        logger.info({ baseUrl }, `Web UI is available at: ${baseUrl}`);
        logger.info(
          `WebSocket is available at: ${baseUrl
            .replace("http:", "ws:")
            .replace("https:", "wss:")}/wss`
        );

        resolve({
          server: this.server,
          wsService: this.wsService,
        });
      });
    });
  }

  close() {
    return new Promise<void>((resolve) => {
      if (this.server) {
        const finalize = () => {
          this.server.close(() => {
            logger.info("Web server stopped");
            resolve();
          });
        };

        if (this.wsService && typeof this.wsService.close === "function") {
          this.wsService
            .close()
            .then(() => finalize())
            .catch(() => finalize());
        } else {
          finalize();
        }
      } else {
        resolve();
      }
    });
  }
}
