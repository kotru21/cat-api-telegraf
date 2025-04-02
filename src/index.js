import config from "./src/config/index.js";
import { likesEvents } from "./src/database/LikesRepository.js";

// Импорт команд бота
import factCommand from "./src/bot/commands/FactCommand.js";
import menuCommand from "./src/bot/commands/MenuCommand.js";
import myLikesCommand from "./src/bot/commands/MyLikesCommand.js";
import topCommand from "./src/bot/commands/TopCommand.js"; // Новый импорт
import likeAction from "./src/bot/actions/LikeAction.js";

import config from "./src/config/index.js";
import { BotService } from "./src/bot/BotService.js";
import { WebServer } from "./src/web/WebServer.js";
import { DatabaseService } from "./src/database/DatabaseService.js";
import { likesEvents } from "./src/database/LikesRepository.js";

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
