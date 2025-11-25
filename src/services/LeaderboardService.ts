import { CatRepository } from '../database/CatRepository.js';
import { Cat } from '@prisma/client';
import { CacheService, CacheKeys, CacheTTL } from './CacheService.js';

export class LeaderboardService {
  private repository: CatRepository;
  private cacheService?: CacheService;

  constructor({
    catRepository,
    cacheService,
  }: {
    catRepository: CatRepository;
    cacheService?: CacheService;
  }) {
    this.repository = catRepository;
    this.cacheService = cacheService;
  }

  async getLeaderboard(limit = 10): Promise<Cat[]> {
    if (this.cacheService) {
      return this.cacheService.getOrSet(
        CacheKeys.leaderboard(limit),
        () => this.repository.getLeaderboard(limit),
        CacheTTL.LEADERBOARD,
      );
    }
    return this.repository.getLeaderboard(limit);
  }

  /**
   * Invalidate leaderboard cache (call after likes change)
   */
  async invalidateCache(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.invalidatePattern('leaderboard:');
    }
  }
}
