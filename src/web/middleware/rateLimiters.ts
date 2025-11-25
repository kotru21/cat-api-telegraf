import { Context, Next, MiddlewareHandler } from 'hono';

// Simple in-memory rate limiter for Hono
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: { error: string };
  keyPrefix?: string;
}): MiddlewareHandler {
  const { windowMs, max, message, keyPrefix = '' } = options;

  return async (c: Context, next: Next) => {
    // Get client IP
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

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
