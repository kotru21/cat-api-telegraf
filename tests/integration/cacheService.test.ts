import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { LeaderboardService } from '../../src/services/LeaderboardService.js';
import { CacheService, CacheKeys } from '../../src/services/CacheService.js';

describe('LeaderboardService Integration', () => {
  let leaderboardService: LeaderboardService;
  let cacheService: CacheService;
  let repositoryCalls: number;

  // Create a mock repository that tracks calls
  const createMockRepository = () => {
    repositoryCalls = 0;
    return {
      getLeaderboard: async (_limit: number) => {
        repositoryCalls++;
        return [
          { id: 'cat1', breed_name: 'Persian', count: 10 },
          { id: 'cat2', breed_name: 'Siamese', count: 8 },
        ];
      },
    };
  };

  beforeAll(() => {
    cacheService = new CacheService({
      defaultTtl: 60,
      keyPrefix: 'test:',
    });

    leaderboardService = new LeaderboardService({
      // @ts-expect-error - mock repository
      catRepository: createMockRepository(),
      cacheService,
    });
  });

  afterAll(async () => {
    await cacheService.close();
  });

  it('should fetch leaderboard from repository on first call', async () => {
    // Invalidate cache to ensure fresh call
    await leaderboardService.invalidateCache();

    const result = await leaderboardService.getLeaderboard(10);

    expect(result).toHaveLength(2);
    expect(result[0].breed_name).toBe('Persian');
    expect(repositoryCalls).toBeGreaterThanOrEqual(1);
  });

  it('should cache leaderboard results', async () => {
    // First call - should hit repository
    await leaderboardService.invalidateCache();
    repositoryCalls = 0;

    await leaderboardService.getLeaderboard(10);
    const callsAfterFirst = repositoryCalls;

    // Second call - should hit cache (no additional repository calls)
    await leaderboardService.getLeaderboard(10);
    const callsAfterSecond = repositoryCalls;

    expect(callsAfterFirst).toBe(callsAfterSecond); // No new calls
  });
});

describe('CacheService Unit Tests', () => {
  let cacheService: CacheService;

  beforeAll(() => {
    cacheService = new CacheService({
      defaultTtl: 1, // 1 second for testing
      keyPrefix: 'unit:',
    });
  });

  afterAll(async () => {
    await cacheService.close();
  });

  it('should store and retrieve values', async () => {
    await cacheService.set('test-key', { foo: 'bar' });
    const result = await cacheService.get<{ foo: string }>('test-key');

    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return null for non-existent keys', async () => {
    const result = await cacheService.get('non-existent');
    expect(result).toBeNull();
  });

  it('should delete values', async () => {
    await cacheService.set('to-delete', 'value');
    await cacheService.delete('to-delete');

    const result = await cacheService.get('to-delete');
    expect(result).toBeNull();
  });

  it('should use getOrSet pattern', async () => {
    let factoryCalls = 0;
    const factory = async () => {
      factoryCalls++;
      return { computed: true };
    };

    // First call - factory should be called
    const result1 = await cacheService.getOrSet('computed-key', factory);
    expect(result1).toEqual({ computed: true });
    expect(factoryCalls).toBe(1);

    // Second call - factory should NOT be called (cached)
    const result2 = await cacheService.getOrSet('computed-key', factory);
    expect(result2).toEqual({ computed: true });
    expect(factoryCalls).toBe(1); // Still 1
  });

  it('should expire values after TTL', async () => {
    await cacheService.set('expiring', 'value', 1); // 1 second TTL

    // Should exist immediately
    const immediate = await cacheService.get('expiring');
    expect(immediate).toBe('value');

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should be gone
    const expired = await cacheService.get('expiring');
    expect(expired).toBeNull();
  });

  it('should report correct stats for memory cache', () => {
    const stats = cacheService.getStats();
    expect(stats.type).toBe('memory');
  });
});

describe('CacheKeys Generation', () => {
  it('should generate correct leaderboard key', () => {
    expect(CacheKeys.leaderboard(10)).toBe('leaderboard:10');
    expect(CacheKeys.leaderboard(5)).toBe('leaderboard:5');
  });

  it('should generate correct cat key', () => {
    expect(CacheKeys.cat('abc123')).toBe('cat:abc123');
  });

  it('should generate correct userLikes key', () => {
    expect(CacheKeys.userLikes('user123')).toBe('user:user123:likes');
  });

  it('should generate correct catsByFeature key', () => {
    expect(CacheKeys.catsByFeature('origin', 'Egypt')).toBe('cats:origin:Egypt');
  });
});
