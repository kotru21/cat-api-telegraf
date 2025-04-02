import express from "express";
import { AuthController } from "./controllers/AuthController.js";
import { CatController } from "./controllers/CatController.js";
import { UserController } from "./controllers/UserController.js";
import { DebugController } from "./controllers/DebugController.js";
import { createLimiters } from "../middleware/rateLimits.js";
import { authMiddleware } from "./auth.js";

export function setupApiRoutes(app, services = {}) {
  // Деструктурирование сервисов для инъекции зависимостей
  const { catService } = services;

  const router = express.Router();

  // Создание контроллеров с передачей зависимостей
  const authController = new AuthController();
  const catController = new CatController(catService);
  const userController = new UserController(catService);
  const debugController = new DebugController();

  // Получение лимитеров из отдельного модуля
  const { apiLimiter, leaderboardLimiter } = createLimiters();

  // Применение базового лимитера ко всем маршрутам API
  router.use(apiLimiter);

  // Группируем маршруты по категориям
  setupCatRoutes(router, catController, leaderboardLimiter);
  setupAuthRoutes(router, authController);
  setupUserRoutes(router, userController, authMiddleware);
  setupDebugRoutes(router, debugController);

  app.use("/api", router);
}

// Выделенные функции для каждой категории маршрутов
function setupCatRoutes(router, catController, leaderboardLimiter) {
  router.get("/cat/:id", catController.getCat);
  router.get("/leaderboard", leaderboardLimiter, catController.getLeaderboard);
  router.get("/similar", catController.getSimilarCats);
  router.get("/random-images", catController.getRandomImages);
}

function setupAuthRoutes(router, authController) {
  router.post("/auth/telegram", authController.authenticateTelegram);
}

function setupUserRoutes(router, userController, authMiddleware) {
  router.get("/profile", authMiddleware, userController.getProfile);
  router.get("/mylikes", authMiddleware, userController.getUserLikes);
  router.delete("/like", authMiddleware, userController.removeLike);
  router.get("/user/likes/count", authMiddleware, userController.getLikesCount);
}

function setupDebugRoutes(router, debugController) {
  router.get("/debug-session", debugController.getDebugInfo);
}
