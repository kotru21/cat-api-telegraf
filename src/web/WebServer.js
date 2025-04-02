import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { WebSocketService } from "./WebSocketServer.js";
import { setupApiRoutes } from "./ApiRoutes.js";
import { setupSecurity } from "./middleware/security.js";
import { setupSession } from "./middleware/session.js";
import { AuthController } from "./controllers/AuthController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  constructor(config, eventEmitters = {}) {
    this.config = config;
    this.eventEmitters = eventEmitters;
    this.app = express();
    this.server = createServer(this.app);
    this.wsService = null;
  }

  initialize() {
    this.app.set("trust proxy", 1);

    // Настройка безопасности
    setupSecurity(this.app);

    // Настройка статических файлов
    this.setupStaticFiles();

    // Настройка сессий
    setupSession(this.app, this.config);

    // Настройка WebSocket
    this.wsService = new WebSocketService(this.server);

    // Настройка событий лидерборда
    if (this.eventEmitters.likesEvents) {
      this.setupLeaderboardEvents();
    }

    // Настройка шаблонизатора
    this.setupTemplateEngine();

    // API маршруты
    setupApiRoutes(this.app);

    // Общие маршруты
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
    this.eventEmitters.likesEvents.on("leaderboardChanged", async () => {
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
          console.error(`Ошибка при чтении файла ${filePath}:`, err);
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
              console.error(`Файл навигации не найден: ${navPath}`);
            }
          } catch (err) {
            console.error(`Ошибка при чтении navigation.html: ${err.message}`);
          }
        }

        callback(null, content);
      });
    });

    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "html");
  }

  setupRoutes() {
    // Основные маршруты
    this.app.get("/", (req, res) => res.render("index"));
    this.app.get("/catDetails", (req, res) => res.render("catDetails"));
    this.app.get("/similar", (req, res) => res.render("similar"));

    // Профиль пользователя
    this.app.get("/profile", (req, res) => {
      if (!req.session.user) {
        return res.redirect("/login");
      }
      res.render("profile");
    });

    // Страница входа
    this.app.get("/login", (req, res) => {
      if (req.session.user) {
        return res.redirect("/profile");
      }
      res.render("login");
    });

    // Выход из системы
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
          this.config.WEBSITE_URL || `http://localhost:${port}`
        ).replace(/\/$/, "");

        console.log(`Сервер запущен на порту ${port}`);
        console.log(`Веб-интерфейс доступен по адресу: ${baseUrl}`);
        console.log(
          `WebSocket доступен по адресу: ${baseUrl
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
        this.server.close(() => {
          console.log("Веб-сервер остановлен");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
