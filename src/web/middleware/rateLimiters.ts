import { Context, Next, MiddlewareHandler } from 'hono';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import logger from '../../utils/logger.js';

// Configuration interface
interface RateLimiterConfig {
  redisEnabled?: boolean;
  redisUrl?: string;
  allowSelfSigned?: boolean;
}

// Simple in-memory rate limiter for Hono
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (fallback for development)
const memoryStore = new Map<string, RateLimitEntry>();

// Redis client instance (lazy initialized for production)
let redisClient: RedisClientType | null = null;
let redisConnected = false;

// Rate limit options
interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: { error: string };
  keyPrefix?: string;
}

// Cleanup old entries periodically (memory store only)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Atomic increment with Redis Lua script
 */
async function redisIncr(
  key: string,
  windowMs: number,
): Promise<{ count: number; resetTime: number } | null> {
  if (!redisClient || !redisConnected) return null;

  try {
    const now = Date.now();
    const resetTime = now + windowMs;

    // Use Lua script for atomic increment with expiry
    const luaScript = `
      local current = redis.call('GET', KEYS[1])
      if current then
        local data = cjson.decode(current)
        if tonumber(data.resetTime) > tonumber(ARGV[1]) then
          data.count = data.count + 1
          redis.call('SET', KEYS[1], cjson.encode(data), 'PX', ARGV[2])
          return cjson.encode(data)
        end
      end
      local newData = { count = 1, resetTime = tonumber(ARGV[3]) }
      redis.call('SET', KEYS[1], cjson.encode(newData), 'PX', ARGV[2])
      return cjson.encode(newData)
    `;

    const result = await redisClient.eval(luaScript, {
      keys: [key],
      arguments: [String(now), String(windowMs), String(resetTime)],
    });

    if (typeof result === 'string') {
      return JSON.parse(result);
    }
    return null;
  } catch (err) {
    logger.warn({ err }, 'Redis rate limit incr error, falling back to memory');
    return null;
  }
}

/**
 * Initialize Redis client for rate limiting (when REDIS_ENABLED=true)
 */
export async function initRateLimitRedis(config: RateLimiterConfig): Promise<void> {
  if (!config.redisEnabled) {
    logger.info('Rate limiter using in-memory store (REDIS_ENABLED=false)');
    return;
  }

  const redisUrl = config.redisUrl;
  if (!redisUrl) {
    logger.warn('REDIS_URL not set, rate limiter using in-memory store');
    return;
  }

  const allowSelfSigned = config.allowSelfSigned === true;
  const isRediss = redisUrl.startsWith('rediss://');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketOptions: any = {
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 2000),
  };

  if (allowSelfSigned && isRediss) {
    socketOptions.tls = { rejectUnauthorized: false };
  }

  redisClient = createRedisClient({
    url: redisUrl,
    socket: socketOptions,
  }) as RedisClientType;

  redisClient.on('ready', () => {
    redisConnected = true;
    logger.info('Redis rate limiter client ready');
  });

  redisClient.on('error', (err) => {
    logger.error({ err }, 'Redis rate limiter client error');
    redisConnected = false;
  });

  redisClient.on('end', () => {
    redisConnected = false;
    logger.warn('Redis rate limiter client disconnected');
  });

  try {
    await redisClient.connect();
  } catch (err) {
    logger.error({ err }, 'Failed to connect Redis rate limiter');
  }
}

/**
 * Creates a rate limiter middleware
 * Uses Redis in production, falls back to in-memory store
 */
function createRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max, message, keyPrefix = '' } = options;

  return async (c: Context, next: Next) => {
    // Get client IP
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';

    const key = `ratelimit:${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry: RateLimitEntry;

    // Try Redis first in production
    const redisEntry = await redisIncr(key, windowMs);
    if (redisEntry) {
      entry = redisEntry;
    } else {
      // Fallback to memory store
      let memEntry = memoryStore.get(key);

      if (!memEntry || now > memEntry.resetTime) {
        memEntry = { count: 1, resetTime: now + windowMs };
        memoryStore.set(key, memEntry);
      } else {
        memEntry.count++;
      }

      entry = memEntry;
    }

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > max) {
      c.header('Retry-After', String(Math.ceil((entry.resetTime - now) / 1000)));
      return c.json(message, 429);
    }

    await next();
  };
}

export function createRateLimiters() {
  // Base limiter for all API requests
  const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Слишком много запросов, пожалуйста, попробуйте позже' },
    keyPrefix: 'api',
  });

  // Stricter limits for leaderboard endpoint
  const leaderboardLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // 30 requests per window
    message: {
      error: 'Слишком много запросов к лидерборду, пожалуйста, попробуйте позже',
    },
    keyPrefix: 'leaderboard',
  });

  return { apiLimiter, leaderboardLimiter };
}
