import { Hono } from 'hono';
import type { Server, ServerWebSocket } from 'bun';
import { BunWebSocketService, type WebSocketClientData } from './BunWebSocketService.js';
import { ApiRouter } from './ApiRoutes.js';
import { AuthController } from './controllers/AuthController.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import AppEvents, { EVENTS } from '../application/events.js';
import { configureMiddleware } from './setup/middleware.js';
import { configureRoutes } from './setup/routes.js';
import { configureErrorHandling } from './setup/errors.js';
import { Config } from '../config/types.js';
import logger from '../utils/logger.js';

/**
 * Web server using native Bun.serve() with WebSocket support
 */
export class WebServer {
  private config: Config;
  private app: Hono;
  private server: Server<WebSocketClientData> | null = null;
  private wsService: BunWebSocketService;
  private authController: AuthController;
  private leaderboardService: LeaderboardService;
  private apiRouter: ApiRouter;
  private isShuttingDown = false;
  private activeConnections = new Set<ServerWebSocket<WebSocketClientData>>();

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

    // Initialize native Bun WebSocket service with config
    this.wsService = new BunWebSocketService({
      leaderboardService: this.leaderboardService,
      enablePolling: false,
      config: this.config,
    });
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

  private setupLeaderboardEvents() {
    AppEvents.on(EVENTS.LEADERBOARD_CHANGED, async () => {
      const changed = await this.wsService.updateLeaderboardHash();
      if (changed) {
        this.wsService.broadcast({ leaderboardChanged: true });
      }
    });
  }

  start() {
    const port = this.config.expressServerPort;
    const wsHandlers = this.wsService.getWebSocketHandlers();

    // Native Bun.serve() with WebSocket support
    this.server = Bun.serve<WebSocketClientData>({
      port,

      fetch: async (req, server) => {
        // Check for WebSocket upgrade
        const url = new URL(req.url);
        if (url.pathname === '/wss') {
          // Reject new connections during shutdown
          if (this.isShuttingDown) {
            return new Response('Server is shutting down', { status: 503 });
          }

          const ip = server.requestIP(req)?.address || 'unknown';
          const clientData = this.wsService.createClientData(ip);

          const upgraded = server.upgrade(req, {
            data: clientData,
          });

          if (upgraded) {
            return undefined; // Bun handles the upgrade
          }
          return new Response('WebSocket upgrade failed', { status: 400 });
        }

        // Handle regular HTTP requests through Hono
        return this.app.fetch(req, { ip: server.requestIP(req)?.address });
      },

      websocket: {
        ...wsHandlers,

        open: (ws: ServerWebSocket<WebSocketClientData>) => {
          this.activeConnections.add(ws);
          this.wsService.subscribeClient(ws);
          wsHandlers.open(ws);
        },

        close: (ws: ServerWebSocket<WebSocketClientData>, code: number, reason: string) => {
          this.activeConnections.delete(ws);
          wsHandlers.close(ws, code, reason);
        },

        message: wsHandlers.message,
      },

      error: (error) => {
        logger.error({ err: error }, 'Bun server error');
        return new Response('Internal Server Error', { status: 500 });
      },
    });

    // Start WebSocket broadcasting
    this.wsService.startBroadcasting(this.server);

    // Setup leaderboard event handlers
    this.setupLeaderboardEvents();

    logger.info({ port }, `Bun web server running on port ${port}`);

    return this.server;
  }

  /**
   * Graceful shutdown with connection draining
   */
  async close(options: { timeout?: number } = {}): Promise<void> {
    const { timeout = 30000 } = options; // 30 second default timeout

    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown...');

    // Stop accepting new WebSocket connections (handled in fetch)
    // Close WebSocket service (stops broadcasting)
    await this.wsService.close();

    // Close all active WebSocket connections gracefully
    const closePromises: Promise<void>[] = [];
    for (const ws of this.activeConnections) {
      closePromises.push(
        new Promise<void>((resolve) => {
          try {
            ws.close(1001, 'Server shutting down');
          } catch {
            // Connection may already be closed
          }
          resolve();
        }),
      );
    }

    // Wait for connections to close with timeout
    await Promise.race([
      Promise.all(closePromises),
      new Promise<void>((resolve) => setTimeout(resolve, timeout)),
    ]);

    // Stop the Bun server
    if (this.server) {
      this.server.stop(true); // Force close remaining connections
      this.server = null;
    }

    logger.info('Web server stopped gracefully');
  }

  /**
   * Legacy stop method for compatibility
   * @deprecated Use close() instead
   */
  stop(callback?: (err?: Error) => void) {
    this.close()
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  /**
   * Get server instance for health checks
   */
  getServer(): Server<WebSocketClientData> | null {
    return this.server;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null && !this.isShuttingDown;
  }
}
