import { Telegraf } from "telegraf";
import RateLimitMiddleware from "telegraf-ratelimit";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import database from "./database/Database.js";
import config from "./config/index.js";
import { incrementMessageCount } from "./utils/messageCounter.js";
import { WebSocketService } from "./web/WebSocketServer.js";
import { setupApiRoutes } from "./web/ApiRoutes.js";
import { likesEvents } from "./database/LikesRepository.js";
import session from "express-session";
import crypto from "crypto";

// Импорт команд бота
import factCommand from "./bot/commands/FactCommand.js";
import menuCommand from "./bot/commands/MenuCommand.js";
import myLikesCommand from "./bot/commands/MyLikesCommand.js";
import topCommand from "./bot/commands/TopCommand.js"; // Новый импорт
import likeAction from "./bot/actions/LikeAction.js";

// Инициализация базы данных
async function initDatabase() {
  await database.init();
}

// Инициализация бота
function initBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Настройка рейт-лимитов для защиты от спама командами
  const limitConfig = {
    window: 3000, // 3 секунды
    limit: 3, // максимум 3 сообщения за период
    onLimitExceeded: (ctx) =>
      ctx.reply("Пожалуйста, не отправляйте команды так часто 🙏"),
  };

  // Применение рейт-лимитов до обработки команд
  bot.use(new RateLimitMiddleware(limitConfig));

  // Middleware для подсчета сообщений
  bot.use((ctx, next) => {
    incrementMessageCount();
    return next();
  });

  // Регистрация middleware команд
  bot.use(
    factCommand.middleware(),
    menuCommand.middleware(),
    myLikesCommand.middleware(),
    topCommand.middleware(),
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

  app.set("trust proxy", 1);

  // // Настройка middleware. Отключено из-за проблем с CSP и Telegram Login Widget
  // app.use(
  //   helmet({
  //     contentSecurityPolicy: {
  //       useDefaults: false,
  //       directives: {
  //         defaultSrc: ["'self'"],
  //         scriptSrc: [
  //           "'self'",
  //           "'unsafe-inline'",
  //           "'unsafe-eval'",
  //           "https://cdn.tailwindcss.com",
  //           "https://cdnjs.cloudflare.com",
  //           "https://telegram.org",
  //           "https://*.telegram.org",
  //           "https://telegram.me",
  //           "https://t.me",
  //           "https://core.telegram.org",
  //           "https://oauth.telegram.org",
  //           "https://tg.dev",
  //         ],
  //         connectSrc: [
  //           "'self'",
  //           "ws:",
  //           "wss:",
  //           "https://*.telegram.org",
  //           "https://oauth.telegram.org",
  //           "https://tg.dev",
  //         ],
  //         styleSrc: [
  //           "'self'",
  //           "'unsafe-inline'",
  //           "https://*.telegram.org",
  //           "https://cdnjs.cloudflare.com",
  //         ],
  //         imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
  //         fontSrc: [
  //           "'self'",
  //           "https://cdnjs.cloudflare.com",
  //           "https://*.telegram.org",
  //         ],
  //         objectSrc: ["'none'"],
  //         mediaSrc: ["'self'"],
  //         frameSrc: [
  //           "'self'",
  //           "https://*.telegram.org",
  //           "https://telegram.me",
  //           "https://t.me",
  //           "https://oauth.telegram.org",
  //           "https://tg.dev",
  //         ],
  //         childSrc: [
  //           "'self'",
  //           "https://*.telegram.org",
  //           "https://telegram.me",
  //           "https://t.me",
  //           "https://oauth.telegram.org",
  //           "https://tg.dev",
  //         ],
  //         formAction: [
  //           "'self'",
  //           "https://*.telegram.org",
  //           "https://oauth.telegram.org",
  //           "https://t.me",
  //         ],
  //         workerSrc: ["'self'", "blob:"],
  //         manifestSrc: ["'self'"],
  //       },
  //     },
  //     crossOriginEmbedderPolicy: false,
  //   })
  // );

  // Включаем CORS
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use("/static", express.static(path.join(__dirname, "public")));

  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  // Настройка WebSocket
  const wsService = new WebSocketService(server);

  //  прослушивание событий изменения рейтинга
  likesEvents.on("leaderboardChanged", async () => {
    // Принудительно обновление хеша лидерборда и уведомление клиентов
    const changed = await wsService.updateLeaderboardHash();
    if (changed) {
      wsService.broadcastData({ leaderboardChanged: true });
    }
  });

  // Настройка API маршрутов
  setupApiRoutes(app);

  // Настройка HTML-маршрутов
  app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "src/web/views/index.html");
    fs.readFile(filePath, "utf8", (err, html) => {
      if (err) return res.status(500).send("Internal Server Error");

      res.send(html);
    });
  });

  app.get("/catDetails", (req, res) => {
    res.sendFile(path.join(__dirname, "src/web/views/catDetails.html"));
  });

  // маршрут для страницы поиска похожих котов
  app.get("/similar", (req, res) => {
    res.sendFile(path.join(__dirname, "src/web/views/similar.html"));
  });

  // маршруты для авторизации
  app.get("/login", (req, res) => {
    // Если пользователь уже авторизован, перенаправляем на профиль
    if (req.session.user) {
      return res.redirect("/profile");
    }
    res.sendFile(path.join(__dirname, "src/web/views/login.html"));
  });

  app.get("/profile", (req, res) => {
    console.log("Запрос на /profile, сессия:", req.session);

    if (!req.session.user) {
      console.log("Пользователь не авторизован, перенаправление на /login");
      return res.redirect("/login");
    }

    console.log("Пользователь авторизован:", req.session.user);
    res.sendFile(path.join(__dirname, "src/web/views/profile.html"));
  });

  // Обработка callback от Telegram Login Widget
  app.get("/auth/telegram/callback", (req, res) => {
    try {
      console.log("Получен callback от Telegram:", req.query);

      // Проверка данных от Telegram
      const {
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      } = req.query;

      // Проверка hash
      const botToken = config.BOT_TOKEN;
      const secretKey = crypto.createHash("sha256").update(botToken).digest();

      //  проверочный хеш
      const dataCheckString = Object.keys(req.query)
        .filter((key) => key !== "hash")
        .sort()
        .map((key) => `${key}=${req.query[key]}`)
        .join("\n");

      const hmac = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      // Если хеш не совпадает, отправляем на страницу логина
      if (hmac !== hash) {
        console.error("Неверный хеш при авторизации через Telegram");
        return res.redirect("/login?error=invalid_hash");
      }

      // Проверяем, что запрос не старше 24 часов
      const authDate = parseInt(auth_date);
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - authDate > 86400) {
        return res.redirect("/login?error=expired");
      }

      // После успешной авторизации
      req.session.user = {
        id,
        first_name,
        last_name,
        username,
        photo_url,
      };

      console.log("Данные пользователя сохранены в сессии:", req.session.user);

      req.session.save((err) => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.redirect("/login?error=session_error");
        }

        console.log("Сессия успешно сохранена. Перенаправление на /profile");
        res.redirect("/profile");
      });
    } catch (error) {
      console.error("Ошибка авторизации через Telegram:", error);
      res.redirect("/login?error=auth_failed");
    }
  });

  app.post("/auth/telegram/callback", (req, res) => {
    try {
      console.log("Получен POST-callback от Telegram:", req.body);

      // Проверка данных от Telegram
      const {
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      } = req.body;

      // Проверка hash
      const botToken = config.BOT_TOKEN;
      const secretKey = crypto.createHash("sha256").update(botToken).digest();

      const dataCheckString = Object.keys(req.body)
        .filter((key) => key !== "hash")
        .sort()
        .map((key) => `${key}=${req.body[key]}`)
        .join("\n");

      console.log("Строка проверки:", dataCheckString);
      console.log(
        "Секретный ключ (первые 10 символов):",
        secretKey.toString("hex").substring(0, 10) + "..."
      );

      const hmac = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");
      console.log("Вычисленный хеш:", hmac);
      console.log("Полученный хеш:", hash);

      // Если хеш не совпадает, отправляем ошибку
      if (hmac !== hash) {
        console.error("Неверный хеш при авторизации через Telegram");
        return res.status(403).json({ error: "invalid_hash" });
      }

      // Проверяем, что запрос не старше 24 часов
      const authDate = parseInt(auth_date);
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - authDate > 86400) {
        return res.status(403).json({ error: "expired" });
      }

      // После успешной авторизации
      req.session.user = { id, first_name, last_name, username, photo_url };

      req.session.save((err) => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.status(500).json({ error: "session_error" });
        }

        res.status(200).json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      console.error("Ошибка авторизации через Telegram:", error);
      res.status(500).json({ error: "auth_failed" });
    }
  });

  // Выход из системы
  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });

  server.listen(port, () => {
    // Получаем базовый URL без слеша в конце
    const baseUrl = (
      process.env.WEBSITE_URL || `http://localhost:${port}`
    ).replace(/\/$/, "");

    console.log(`Сервер запущен на порту ${port}`);
    console.log(`Веб-интерфейс доступен по адресу: ${baseUrl}`);
    console.log(
      `WebSocket доступен по адресу: ${baseUrl
        .replace("http:", "ws:")
        .replace("https:", "wss:")}/wss`
    );
    console.log(`Панель администратора: ${baseUrl}/admin`);
    console.log(`API лидерборда: ${baseUrl}/api/leaderboard`);
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
