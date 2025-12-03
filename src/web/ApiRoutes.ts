import { Hono } from 'hono';
import { createRateLimiters, initRateLimitRedis } from './middleware/rateLimiters.js';
import { setupAuthMiddleware } from './middleware/authMiddleware.js';
import { setupCatRoutes } from './routes/catRoutes.js';
import { setupUserRoutes } from './routes/userRoutes.js';
import { setupAuthRoutes } from './routes/authRoutes.js';
import { setupDebugRoutes } from './routes/debugRoutes.js';
import { CatInfoService } from '../services/CatInfoService.js';
import { LikeService } from '../services/LikeService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { AuthService } from '../services/AuthService.js';
import { Config } from '../config/types.js';

export class ApiRouter {
  private config: Config;
  private catInfoService: CatInfoService;
  private likeService: LikeService;
  private leaderboardService: LeaderboardService;
  private authService: AuthService;

  constructor({
    config,
    catInfoService,
    likeService,
    leaderboardService,
    authService,
  }: {
    config: Config;
    catInfoService: CatInfoService;
    likeService: LikeService;
    leaderboardService: LeaderboardService;
    authService: AuthService;
  }) {
    this.config = config;
    this.catInfoService = catInfoService;
    this.likeService = likeService;
    this.leaderboardService = leaderboardService;
    this.authService = authService;

    // Initialize Redis rate limiter in background (non-blocking)
    initRateLimitRedis({
      redisEnabled: config.REDIS_ENABLED,
      redisUrl: config.REDIS_URL,
      allowSelfSigned: config.REDIS_ALLOW_SELF_SIGNED,
    });
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
