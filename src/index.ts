import config from './config/index.js';

import { buildContainer } from './di/container.js';
import { setAppContainer } from './application/context.js';

import { BotService } from './bot/BotService.js';
import { WebServer } from './web/WebServer.js';
import logger from './utils/logger.js';
import getPrisma from './database/prisma/PrismaClient.js';

import { AwilixContainer } from 'awilix';
import { Config } from './config/types.js';

// Graceful shutdown timeout in milliseconds
const SHUTDOWN_TIMEOUT_MS = 30000;

class Application {
  private config: Config;
  private container: AwilixContainer;
  private botService: BotService;
  private webServer: WebServer | null;
  private isShuttingDown = false;

  constructor() {
    this.config = config;
    this.container = buildContainer();
    // Устанавливаем контейнер приложения глобально для use-cases/web
    setAppContainer(this.container);
    // Prisma is initialized lazily via getPrisma
    this.botService = this.container.resolve('botService');
    this.webServer = null;

    if (this.config.WEB_ENABLED !== false) {
      this.webServer = this.container.resolve('webServer');
    } else {
      logger.info('Web server is disabled by configuration (WEB_ENABLED=false)');
    }
  }

  async initialize() {
    try {
      // Start web server if enabled
      if (this.webServer) {
        logger.info('Starting web server...');
        this.webServer.initialize();
        this.webServer.start();
      }

      // Launch bot (optional)
      if (this.config.BOT_ENABLED !== false) {
        await this.botService.launch();
      } else {
        logger.info('Bot is disabled by configuration (BOT_ENABLED=false)');
      }

      this.setupShutdownHandlers();

      return true;
    } catch (error) {
      logger.error({ err: error }, 'Application startup error');
      return false;
    }
  }

  setupShutdownHandlers() {
    const shutdown = async (signal: string) => {
      // Prevent multiple shutdown attempts
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal');
        return;
      }
      this.isShuttingDown = true;

      logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

      // Create shutdown timeout
      const forceExitTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);

      try {
        // Stop accepting new bot updates
        logger.info('Stopping bot...');
        this.botService.stop();

        // Gracefully close web server (drains connections)
        if (this.webServer) {
          logger.info('Closing web server...');
          await this.webServer.close({ timeout: SHUTDOWN_TIMEOUT_MS - 5000 });
        }

        // Disconnect Prisma client
        logger.info('Disconnecting database...');
        try {
          const prisma = getPrisma();
          if (prisma && prisma.$disconnect) {
            await prisma.$disconnect();
            logger.info('Prisma client disconnected');
          }
        } catch (e) {
          logger.warn({ err: e }, 'Failed to disconnect Prisma client');
        }

        // Clear the force exit timeout
        clearTimeout(forceExitTimeout);

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        clearTimeout(forceExitTimeout);
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception');
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.fatal({ err: reason }, 'Unhandled promise rejection');
      shutdown('unhandledRejection');
    });
  }
}

// Application startup
const app = new Application();
app.initialize().catch((error) => {
  logger.error({ err: error }, 'Critical startup error');
  process.exit(1);
});
