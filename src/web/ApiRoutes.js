import express from "express";
import { createRateLimiters } from "./middleware/rateLimiters.js";
import { setupAuthMiddleware } from "./middleware/authMiddleware.js";
import { setupCatRoutes } from "./routes/catRoutes.js";
import { setupUserRoutes } from "./routes/userRoutes.js";
import { setupAuthRoutes } from "./routes/authRoutes.js";
import { setupDebugRoutes } from "./routes/debugRoutes.js";
import defaultCatService from "../services/CatService.js";

export function setupApiRoutes(app, dependencies = {}) {
  const { catService: catServiceInstance = defaultCatService } = dependencies;

  const router = express.Router();

  // Создаем лимитеры запросов
  const { apiLimiter, leaderboardLimiter } = createRateLimiters();

  // Применяем базовый лимитер ко всем маршрутам API
  router.use(apiLimiter);

  // Настраиваем middleware аутентификации
  const { requireAuth } = setupAuthMiddleware();

  // Настраиваем маршруты по категориям
  setupCatRoutes(router, {
    catService: catServiceInstance,
    requireAuth,
    leaderboardLimiter,
  });

  setupUserRoutes(router, {
    catService: catServiceInstance,
    requireAuth,
  });

  setupAuthRoutes(router, {
    catService: catServiceInstance,
  });

  setupDebugRoutes(router);

  // Подключаем роутер к приложению
  app.use("/api", router);
}
