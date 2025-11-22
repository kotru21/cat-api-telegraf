import express, { Express } from 'express';
import { createRateLimiters } from './middleware/rateLimiters.js';
import { setupAuthMiddleware } from './middleware/authMiddleware.js';
import { setupCatRoutes } from './routes/catRoutes.js';
import { setupUserRoutes } from './routes/userRoutes.js';
import { setupAuthRoutes } from './routes/authRoutes.js';
import { setupDebugRoutes } from './routes/debugRoutes.js';
import { CatInfoService } from '../services/CatInfoService.js';
import { LikeService } from '../services/LikeService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';

export class ApiRouter {
  private catInfoService: CatInfoService;
  private likeService: LikeService;
  private leaderboardService: LeaderboardService;

  constructor({
    catInfoService,
    likeService,
    leaderboardService,
  }: {
    catInfoService: CatInfoService;
    likeService: LikeService;
    leaderboardService: LeaderboardService;
  }) {
    this.catInfoService = catInfoService;
    this.likeService = likeService;
    this.leaderboardService = leaderboardService;
  }

  setup(app: Express) {
    const router = express.Router();

    // Request rate limiters
    const { apiLimiter, leaderboardLimiter } = createRateLimiters();

    // Global API limiter
    router.use(apiLimiter);

    // Auth middleware
    const { requireAuth } = setupAuthMiddleware();

    // Category routes
    setupCatRoutes(router, {
      catInfoService: this.catInfoService,
      likeService: this.likeService,
      leaderboardService: this.leaderboardService,
      requireAuth,
      leaderboardLimiter,
    });

    setupUserRoutes(router, {
      likeService: this.likeService,
      requireAuth,
    });

    setupAuthRoutes(router);

    setupDebugRoutes(router);

    // Mount router at /api
    app.use('/api', router);
  }
}

// Legacy export for backward compatibility if needed (but we are refactoring)
export function setupApiRoutes(app: Express, dependencies: any = {}) {
  // This function is deprecated and replaced by ApiRouter class
  throw new Error('Use ApiRouter class instead');
}
