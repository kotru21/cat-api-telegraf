import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { WebSocketService } from './WebSocketServer.js';
import { ApiRouter } from './ApiRoutes.js';
import { AuthController } from './controllers/AuthController.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import AppEvents, { EVENTS } from '../application/events.js';
import { configureMiddleware } from './setup/middleware.js';
import { configureViews } from './setup/views.js';
import { configureRoutes } from './setup/routes.js';
import { configureErrorHandling } from './setup/errors.js';
import { Config } from '../config/types.js';

export class WebServer {
  private config: Config;
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
    config: Config;
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
    configureMiddleware(this.app, this.config);
    configureViews(this.app);

    // WebSocket setup
    this.wsService = new WebSocketService(this.server, '/wss', {
      leaderboardService: this.leaderboardService,
      enablePolling: false,
    });

    // Leaderboard updates via AppEvents
    this.setupLeaderboardEvents();

    configureRoutes(this.app);

    // API routes
    this.apiRouter.setup(this.app);

    // Auth routes
    this.authController.setupRoutes(this.app);

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
    this.server.listen(port, () => {
      // logger.info(`Web server running on port ${port}`);
    });
    return this.server;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  stop(callback?: (err?: Error) => void) {
    this.server.close(callback);
  }
}
