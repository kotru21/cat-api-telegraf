import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { WebSocketService } from "./WebSocketServer.js";
import { createAppContext } from "../application/context.js";
import { setupApiRoutes } from "./ApiRoutes.js";
import { setupSecurity } from "./middleware/security.js";
import { setupSession } from "./middleware/session.js";
import { AuthController } from "./controllers/AuthController.js";
import { AppError } from "../application/errors.js";
import logger from "../utils/logger.js";
import pinoHttp from "pino-http";

import AppEvents, { EVENTS } from "../application/events.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  constructor(config, dependencies = {}) {
    this.config = config;
    this.dependencies = dependencies;
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
        genReqId: (req, res) => req.headers["x-request-id"] || undefined,
        // pino-http@9: signature (req, res, err)
        customLogLevel: (req, res, err) => {
          if (err || (res && res.statusCode >= 500)) return "error";
          if (res && res.statusCode >= 400) return "warn";
          return "info";
        },
      })
    );

    // Static files
    this.setupStaticFiles();

    // Session management
    setupSession(this.app, this.config);

    // WebSocket setup
    const appCtx = createAppContext(this.dependencies);
    this.wsService = new WebSocketService(this.server, "/wss", {
      catService: appCtx.catService,
      enablePolling: false,
    });

    // Leaderboard updates via AppEvents
    this.setupLeaderboardEvents();

    // View engine
    this.setupTemplateEngine();

    // API routes
    setupApiRoutes(this.app);

    // Centralized error handler (last)
    // eslint-disable-next-line no-unused-vars
    this.app.use((err, req, res, next) => {
      if (err instanceof AppError) {
        logger.warn({ err }, "AppError");
        return res
          .status(err.status)
          .json({ error: err.message, code: err.code });
      }
      logger.error({ err }, "Unhandled error");
      res.status(500).json({ error: "Internal Server Error" });
    });

    this.setupRoutes();

    // Контроллер аутентификации
    const authController = new AuthController(this.config);
    authController.setupRoutes(this.app);

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
      const changed = await this.wsService.updateLeaderboardHash();
      if (changed) {
        this.wsService.broadcastData({ leaderboardChanged: true });
      }
    });
  }

  setupTemplateEngine() {
    this.app.engine("html", (filePath, options, callback) => {
      fs.readFile(filePath, "utf8", (err, content) => {
        if (err) {
          logger.error({ err, filePath }, `Error reading template file`);
          return callback(err);
        }

        // Заменяем маркеры на содержимое шаблонов
        if (content.includes("<!-- INCLUDE_NAVIGATION -->")) {
          const navPath = path.join(
            __dirname,
            "views/partials/navigation.html"
          );

          try {
            if (fs.existsSync(navPath)) {
              const navContent = fs.readFileSync(navPath, "utf8");
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
      });
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
      if (!req.session.user) {
        return res.redirect("/login");
      }
      res.render("profile");
    });

    // Login page
    this.app.get("/login", (req, res) => {
      if (req.session.user) {
        return res.redirect("/profile");
      }
      res.render("login");
    });

    // Logout
    this.app.get("/logout", (req, res) => {
      req.session.destroy();
      res.redirect("/");
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
    return new Promise((resolve) => {
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
