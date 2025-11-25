import config from './config/index.js';

import { buildContainer } from './di/container.js';
import { setAppContainer } from './application/context.js';

import { BotService } from './bot/BotService.js';
import { WebServer } from './web/WebServer.js';
import logger from './utils/logger.js';
import getPrisma from './database/prisma/PrismaClient.js';

// Process diagnostics
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
process.on('exit', (code) => {
  logger.info({ code }, 'Process exit');
});

import { AwilixContainer } from 'awilix';
import { Config } from './config/types.js';

class Application {
  private config: Config;
  private container: AwilixContainer;
  private botService: BotService;
  private webServer: WebServer | null;

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
        await this.webServer.start();
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
    const shutdown = async () => {
      logger.info('Shutting down application...');
      this.botService.stop();

      if (this.webServer) {
        await this.webServer.close();
      }
      // Gracefully disconnect Prisma singleton
      try {
        const prisma = getPrisma();
        if (prisma && prisma.$disconnect) {
          await prisma.$disconnect();
          logger.info('Prisma client disconnected');
        }
      } catch (e) {
        logger.warn({ err: e }, 'Failed to disconnect Prisma client');
      }
      process.exit(0);
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
}

// Запуск приложения
const app = new Application();
app.initialize().catch((error) => {
  logger.error({ err: error }, 'Critical startup error');
  process.exit(1);
});
