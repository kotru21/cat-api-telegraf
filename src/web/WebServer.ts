import { Hono } from 'hono';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketService } from './WebSocketServer.js';
import { ApiRouter } from './ApiRoutes.js';
import { AuthController } from './controllers/AuthController.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import AppEvents, { EVENTS } from '../application/events.js';
import { configureMiddleware } from './setup/middleware.js';
import { configureRoutes } from './setup/routes.js';
import { configureErrorHandling } from './setup/errors.js';
import { Config } from '../config/types.js';
import logger from '../utils/logger.js';

export class WebServer {
  private config: Config;
  private app: Hono;
  private server: HttpServer | null = null;
  private wsService: WebSocketService | null = null;
  private authController: AuthController;
  private leaderboardService: LeaderboardService;
  private apiRouter: ApiRouter;

  constructor({
    config,
    authController,
    leaderboardService,
    apiRouter,
  }: {
    config: Config;
    authController: AuthController;
    leaderboardService: LeaderboardService;
    apiRouter: ApiRouter;
  }) {
    this.config = config;
    this.authController = authController;
    this.leaderboardService = leaderboardService;
    this.apiRouter = apiRouter;
    this.app = new Hono();
  }

  initialize() {
    // Configure middleware (security, logging, session, etc.)
    configureMiddleware(this.app, this.config);

    // Configure static files and view routes
    configureRoutes(this.app);

    // API routes
    this.apiRouter.setup(this.app);

    // Auth routes
    this.authController.setupRoutes(this.app);

    // Error handling (should be last)
    configureErrorHandling(this.app);

    return this;
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

  start() {
    const port = this.config.expressServerPort;

    // Create HTTP server from Hono app for WebSocket support
    this.server = createServer(async (req, res) => {
      // Convert Node.js IncomingMessage to Fetch Request
      const url = `http://${req.headers.host}${req.url}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      // Read body for non-GET/HEAD requests
      let body: BodyInit | null = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      }

      const request = new Request(url, {
        method: req.method,
        headers,
        body,
      });

      try {
        const response = await this.app.fetch(request);

        // Set status and headers
        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        // Send body
        if (response.body) {
          const reader = response.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          };
          await pump();
        } else {
          res.end();
        }
      } catch (err) {
        logger.error({ err }, 'Request handling error');
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // WebSocket setup
    this.wsService = new WebSocketService(this.server, '/wss', {
      leaderboardService: this.leaderboardService,
      enablePolling: false,
    });

    // Leaderboard updates via AppEvents
    this.setupLeaderboardEvents();

    this.server.listen(port, () => {
      logger.info({ port }, `Web server running on port ${port}`);
    });

    return this.server;
  }

  async close(): Promise<void> {
    if (this.wsService) {
      await this.wsService.close();
    }

    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  stop(callback?: (err?: Error) => void) {
    if (this.server) {
      this.server.close(callback);
    } else if (callback) {
      callback();
    }
  }
}
