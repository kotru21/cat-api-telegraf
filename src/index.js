import config from "./config/index.js";

// Импорт команд бота
import factCommand from "./bot/commands/FactCommand.js";
import menuCommand from "./bot/commands/MenuCommand.js";
import myLikesCommand from "./bot/commands/MyLikesCommand.js";
import topCommand from "./bot/commands/TopCommand.js";
import likeAction from "./bot/actions/LikeAction.js";
import { likesEvents } from "./database/LikesRepository.js";

import { BotService } from "./bot/BotService.js";
import { WebServer } from "./web/WebServer.js";
import { DatabaseService } from "./database/DatabaseService.js";

class Application {
  constructor() {
    this.dbService = new DatabaseService();
    this.botService = new BotService(config, [
      factCommand,
      menuCommand,
      myLikesCommand,
      topCommand,
      likeAction,
    ]);
    this.webServer = null;

    if (config.WebServer) {
      this.webServer = new WebServer(config, { likesEvents });
    }
  }

  async initialize() {
    try {
      // Инициализация базы данных
      await this.dbService.initialize();

      // Инициализация веб-сервера если включено в конфиге
      if (this.webServer) {
        console.log("Запуск веб-сервера...");
        this.webServer.initialize();
        await this.webServer.start();
      }

      // Запуск бота
      await this.botService.launch();

      this.setupShutdownHandlers();

      return true;
    } catch (error) {
      console.error("Ошибка запуска приложения:", error);
      return false;
    }
  }

  setupShutdownHandlers() {
    const shutdown = async () => {
      console.log("Выключение приложения...");
      this.botService.stop();

      if (this.webServer) {
        await this.webServer.close();
      }

      await this.dbService.close();
      process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }
}

// Запуск приложения
const app = new Application();
app.initialize().catch((error) => {
  console.error("Критическая ошибка при запуске:", error);
  process.exit(1);
});
