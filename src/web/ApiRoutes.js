import express from "express";
import { createRateLimiters } from "./middleware/rateLimiters.js";
import { setupAuthMiddleware } from "./middleware/authMiddleware.js";
import { setupCatRoutes } from "./routes/catRoutes.js";
import { setupUserRoutes } from "./routes/userRoutes.js";
import { setupAuthRoutes } from "./routes/authRoutes.js";
import { setupDebugRoutes } from "./routes/debugRoutes.js";
import { createAppContext } from "../application/context.js";

export function setupApiRoutes(app, dependencies = {}) {
  const { catService: overrideCatService } = dependencies;
  const appCtx = createAppContext({ catService: overrideCatService });

  const router = express.Router();

  // Request rate limiters
  const { apiLimiter, leaderboardLimiter } = createRateLimiters();

  // Global API limiter
  router.use(apiLimiter);

  // Auth middleware
  const { requireAuth } = setupAuthMiddleware();

  // Category routes
  setupCatRoutes(router, {
    catService: appCtx.catService,
    requireAuth,
    leaderboardLimiter,
  });

  setupUserRoutes(router, {
    catService: appCtx.catService,
    requireAuth,
  });

  setupAuthRoutes(router, {
    catService: appCtx.catService,
  });

  setupDebugRoutes(router);

  // Mount router at /api
  app.use("/api", router);
}
