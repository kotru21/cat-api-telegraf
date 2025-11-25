import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger.js';

/**
 * Cache service configuration
 */
export interface CacheConfig {
  redisUrl?: string;
  allowSelfSigned?: boolean;
  defaultTtl?: number; // seconds
  keyPrefix?: string;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

/**
 * In-memory LRU cache for development/fallback
 */
class LRUCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlMs: number): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Unified cache service supporting Redis (production) and in-memory LRU (development)
 */
export class CacheService {
  private redisClient: RedisClientType | null = null;
  private memoryCache: LRUCache<string>;
  private isRedisConnected = false;
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      redisUrl: config.redisUrl || '',
      allowSelfSigned: config.allowSelfSigned || false,
      defaultTtl: config.defaultTtl || 300, // 5 minutes default
      keyPrefix: config.keyPrefix || 'cache:',
    };

    this.memoryCache = new LRUCache(1000);
  }

  /**
   * Initialize Redis connection (call in production)
   */
  async connectRedis(): Promise<boolean> {
    if (!this.config.redisUrl) {
      logger.info('No Redis URL provided, using in-memory cache');
      return false;
    }

    try {
      const isRediss = this.config.redisUrl.startsWith('rediss://');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Redis socket options type mismatch
      const socketOptions: any = {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 2000),
      };

      if (this.config.allowSelfSigned && isRediss) {
        socketOptions.tls = { rejectUnauthorized: false };
      }

      this.redisClient = createClient({
        url: this.config.redisUrl,
        socket: socketOptions,
      });

      this.redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis cache client error');
        this.isRedisConnected = false;
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis cache client ready');
        this.isRedisConnected = true;
      });

      this.redisClient.on('end', () => {
        logger.warn('Redis cache client disconnected');
        this.isRedisConnected = false;
      });

      await this.redisClient.connect();
      this.isRedisConnected = true;
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis cache');
      this.isRedisConnected = false;
      return false;
    }
  }

  /**
   * Get full cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);

    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(fullKey);
        if (data) {
          const entry: CacheEntry<T> = JSON.parse(data);
          return entry.data;
        }
        return null;
      } catch (error) {
        logger.warn({ error, key }, 'Redis get failed, falling back to memory');
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(fullKey);
    if (cached) {
      try {
        const entry: CacheEntry<T> = JSON.parse(cached);
        return entry.data;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const ttl = ttlSeconds ?? this.config.defaultTtl;

    const entry: CacheEntry<T> = {
      data: value,
      cachedAt: Date.now(),
    };

    const serialized = JSON.stringify(entry);

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(fullKey, serialized, { EX: ttl });
        return;
      } catch (error) {
        logger.warn({ error, key }, 'Redis set failed, falling back to memory');
      }
    }

    // Fallback to memory cache
    this.memoryCache.set(fullKey, serialized, ttl * 1000);
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(fullKey);
      } catch (error) {
        logger.warn({ error, key }, 'Redis delete failed');
      }
    }

    this.memoryCache.delete(fullKey);
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate cache entries by pattern (prefix)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const fullPattern = this.getKey(pattern);

    if (this.isRedisConnected && this.redisClient) {
      try {
        // Use SCAN for production-safe key deletion
        let cursor = '0';
        do {
          const result = await this.redisClient.scan(cursor, {
            MATCH: `${fullPattern}*`,
            COUNT: 100,
          });
          cursor = String(result.cursor);

          if (result.keys.length > 0) {
            await this.redisClient.del(result.keys);
          }
        } while (cursor !== '0');
      } catch (error) {
        logger.warn({ error, pattern }, 'Redis pattern invalidation failed');
      }
    }

    // Memory cache doesn't support pattern deletion efficiently
    // Clear all for simplicity (acceptable for development)
    this.memoryCache.clear();
  }

  /**
   * Check if service is using Redis
   */
  isUsingRedis(): boolean {
    return this.isRedisConnected;
  }

  /**
   * Get cache stats
   */
  getStats(): { type: 'redis' | 'memory'; size?: number } {
    if (this.isRedisConnected) {
      return { type: 'redis' };
    }
    return { type: 'memory', size: this.memoryCache.size() };
  }

  /**
   * Cleanup
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
    this.memoryCache.clear();
    this.isRedisConnected = false;
    logger.info('Cache service closed');
  }
}

/**
 * Cache key generators for common entities
 */
export const CacheKeys = {
  leaderboard: (limit: number) => `leaderboard:${limit}`,
  cat: (id: string) => `cat:${id}`,
  userLikes: (userId: string) => `user:${userId}:likes`,
  catsByFeature: (feature: string, value: string) => `cats:${feature}:${value}`,
  randomImages: (count: number) => `random-images:${count}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  LEADERBOARD: 60, // 1 minute
  CAT_DETAILS: 3600, // 1 hour
  USER_LIKES: 300, // 5 minutes
  CATS_BY_FEATURE: 1800, // 30 minutes
  RANDOM_IMAGES: 60, // 1 minute
};
