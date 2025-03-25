import { Telegraf } from "telegraf";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import database from "./database/Database.js";
import config from "./config/index.js";
import { incrementMessageCount } from "./utils/messageCounter.js";
import { WebSocketService } from "./web/WebSocketServer.js";
import { setupApiRoutes } from "./web/ApiRoutes.js";

// Импорт команд бота
import factCommand from "./bot/commands/FactCommand.js";
import menuCommand from "./bot/commands/MenuCommand.js";
import myLikesCommand from "./bot/commands/MyLikesCommand.js";
import likeAction from "./bot/actions/LikeAction.js";

// Инициализация базы данных
async function initDatabase() {
  await database.init();
}

// Инициализация бота
function initBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Middleware для подсчета сообщений
  bot.use((ctx, next) => {
    incrementMessageCount();
    return next();
  });

  // Регистрация команд
  const commands = [
    factCommand.getCommandInfo(),
    menuCommand.getCommandInfo(),
    myLikesCommand.getCommandInfo(),
  ];

  bot.telegram.setMyCommands(commands);

  // Подключение обработчиков
  bot.use(
    factCommand.middleware(),
    menuCommand.middleware(),
    myLikesCommand.middleware(),
    likeAction.middleware()
  );

  // Обработчик команды /start
  bot.start((ctx) =>
    ctx.reply("Привет! Я бот с фактами о кошках. Используй /menu для навигации")
  );

  return bot;
}

// Инициализация веб-сервера
function initWebServer(port) {
  const app = express();
  const server = createServer(app);
  const __dirname = path.resolve();

  // Настройка middleware
  app.use(cors());
  app.use(express.json());
  app.use("/static", express.static(path.join(__dirname, "public")));

  // Настройка WebSocket
  const wsService = new WebSocketService(server);

  // Настройка API маршрутов
  setupApiRoutes(app);

  // Настройка HTML-маршрутов
  app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "src/web/views/index.html");
    fs.readFile(filePath, "utf8", (err, html) => {
      if (err) return res.status(500).send("Internal Server Error");
      const modified = html.replace("{{apiPort}}", port);
      res.send(modified);
    });
  });

  app.get("/catDetails", (req, res) => {
    res.sendFile(path.join(__dirname, "src/web/views/catDetails.html"));
  });

  // Запуск сервера
  server
    .listen(port, () => {
      const hostname = "localhost";
      const httpUrl = `http://${hostname}:${port}`;
      const wsUrl = `ws://${hostname}:${port}/wss`;

      console.log(`Сервер запущен на порту ${port}`);
      console.log(`Веб-интерфейс доступен по адресу: ${httpUrl}`);
      console.log(`WebSocket доступен по адресу: ${wsUrl}`);
      console.log(`Панель администратора: ${httpUrl}/admin`);
      console.log(`API лидерборда: ${httpUrl}/api/leaderboard`);
    })
    .on("error", (err) => {
      console.error(`Ошибка запуска сервера: ${err.message}`);
      if (err.code === "EADDRINUSE") {
        console.error(`Порт ${port} уже используется другим приложением.`);
      }
    });

  return { server, wsService };
}

// Основная функция запуска приложения
async function bootstrap() {
  try {
    // Инициализация базы данных
    await initDatabase();

    // Запуск веб-сервера если включено в конфиге
    let server = null;
    if (config.WebServer) {
      console.log("Запуск веб-сервера...");
      server = initWebServer(config.expressServerPort);
    }

    // Инициализация бота
    const bot = initBot();

    // Запуск бота
    await bot.launch();
    console.log("Бот успешно запущен");

    // Обработка сигналов завершения
    const shutdown = async () => {
      console.log("Выключение приложения...");
      bot.stop("SIGTERM");
      await database.close();
      process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    return { bot, server };
  } catch (error) {
    console.error("Ошибка запуска приложения:", error);
    process.exit(1);
  }
}

// Запуск приложения
bootstrap();
