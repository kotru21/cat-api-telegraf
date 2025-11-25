import { Hono } from 'hono';
import { createRateLimiters } from './middleware/rateLimiters.js';
import { setupAuthMiddleware } from './middleware/authMiddleware.js';
import { setupCatRoutes } from './routes/catRoutes.js';
import { setupUserRoutes } from './routes/userRoutes.js';
import { setupAuthRoutes } from './routes/authRoutes.js';
import { setupDebugRoutes } from './routes/debugRoutes.js';
import { CatInfoService } from '../services/CatInfoService.js';
import { LikeService } from '../services/LikeService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { AuthService } from '../services/AuthService.js';

export class ApiRouter {
  private catInfoService: CatInfoService;
  private likeService: LikeService;
  private leaderboardService: LeaderboardService;
  private authService: AuthService;

  constructor({
    catInfoService,
    likeService,
    leaderboardService,
    authService,
  }: {
    catInfoService: CatInfoService;
    likeService: LikeService;
    leaderboardService: LeaderboardService;
    authService: AuthService;
  }) {
    this.catInfoService = catInfoService;
    this.likeService = likeService;
    this.leaderboardService = leaderboardService;
    this.authService = authService;
  }

  setup(app: Hono) {
    // Create a sub-router for /api
    const apiRouter = new Hono();

    // Request rate limiters
    const { apiLimiter, leaderboardLimiter } = createRateLimiters();

    // Global API limiter
    apiRouter.use('*', apiLimiter);

    // Auth middleware
    const { requireAuth } = setupAuthMiddleware();

    // Category routes
    setupCatRoutes(apiRouter, {
      catInfoService: this.catInfoService,
      likeService: this.likeService,
      leaderboardService: this.leaderboardService,
      requireAuth,
      leaderboardLimiter,
    });

    setupUserRoutes(apiRouter, {
      likeService: this.likeService,
      requireAuth,
    });

    setupAuthRoutes(apiRouter, { authService: this.authService });

    setupDebugRoutes(apiRouter);

    // Mount router at /api
    app.route('/api', apiRouter);
  }
}
