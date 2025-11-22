import express from "express";
import { createRateLimiters } from "./middleware/rateLimiters.js";
import { setupAuthMiddleware } from "./middleware/authMiddleware.js";
import { setupCatRoutes } from "./routes/catRoutes.js";
import { setupUserRoutes } from "./routes/userRoutes.js";
import { setupAuthRoutes } from "./routes/authRoutes.js";
import { setupDebugRoutes } from "./routes/debugRoutes.js";
import { createAppContext } from "../application/context.js";

export function setupApiRoutes(app, dependencies = {}) {
  const appCtx = createAppContext(dependencies);

  const router = express.Router();

  // Request rate limiters
  const { apiLimiter, leaderboardLimiter } = createRateLimiters();

  // Global API limiter
  router.use(apiLimiter);

  // Auth middleware
  const { requireAuth } = setupAuthMiddleware();

  // Category routes
  setupCatRoutes(router, {
    catInfoService: appCtx.catInfoService,
    likeService: appCtx.likeService,
    leaderboardService: appCtx.leaderboardService,
    requireAuth,
    leaderboardLimiter,
  });

  setupUserRoutes(router, {
    likeService: appCtx.likeService,
    requireAuth,
  });

  setupAuthRoutes(router);

  setupDebugRoutes(router);

  // Mount router at /api
  app.use("/api", router);
}
