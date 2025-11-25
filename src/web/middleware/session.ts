import { Hono, Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import crypto from 'crypto';
import logger from '../../utils/logger.js';
import { Config } from '../../config/types.js';
import { SessionData } from '../../types/hono.js';

// In-memory session store for development
const memoryStore = new Map<string, { data: SessionData; expires: number }>();

// Redis client instance (lazy initialized)
let redisClient: RedisClientType | null = null;

const SESSION_COOKIE_NAME = 'sid';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_PREFIX = 'sess:';

interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, maxAge: number): Promise<void>;
  destroy(sessionId: string): Promise<void>;
}

// Memory store implementation
const memorySessionStore: SessionStore = {
  async get(sessionId: string): Promise<SessionData | null> {
    const entry = memoryStore.get(sessionId);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      memoryStore.delete(sessionId);
      return null;
    }
    return entry.data;
  },
  async set(sessionId: string, data: SessionData, maxAge: number): Promise<void> {
    memoryStore.set(sessionId, {
      data,
      expires: Date.now() + maxAge,
    });
  },
  async destroy(sessionId: string): Promise<void> {
    memoryStore.delete(sessionId);
  },
};

// Redis store implementation
function createRedisSessionStore(client: RedisClientType): SessionStore {
  return {
    async get(sessionId: string): Promise<SessionData | null> {
      try {
        const data = await client.get(SESSION_PREFIX + sessionId);
        if (!data) return null;
        return JSON.parse(data);
      } catch (err) {
        logger.error({ err }, 'Redis session get error');
        return null;
      }
    },
    async set(sessionId: string, data: SessionData, maxAge: number): Promise<void> {
      try {
        await client.set(SESSION_PREFIX + sessionId, JSON.stringify(data), {
          PX: maxAge,
        });
      } catch (err) {
        logger.error({ err }, 'Redis session set error');
      }
    },
    async destroy(sessionId: string): Promise<void> {
      try {
        await client.del(SESSION_PREFIX + sessionId);
      } catch (err) {
        logger.error({ err }, 'Redis session destroy error');
      }
    },
  };
}

export function setupSession(app: Hono, config: Config) {
  const isProd = process.env.NODE_ENV === 'production';

  // Production requires explicit secret
  if (isProd && !config.SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET is required in production. Please set it via environment variable.',
    );
  }

  let store: SessionStore = memorySessionStore;

  // Setup Redis store in production
  if (isProd) {
    if (!process.env.REDIS_URL && !config.REDIS_URL) {
      throw new Error('REDIS_URL is required in production for session store.');
    }
    const redisUrl = config.REDIS_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL is required in production for session store.');
    }
    const allowSelfSigned =
      config.REDIS_ALLOW_SELF_SIGNED || process.env.REDIS_ALLOW_SELF_SIGNED === 'true';
    const isRediss = redisUrl.startsWith('rediss://');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socketOptions: any = {
      reconnectStrategy: (r: number) => Math.min(r * 50, 2000),
    };

    if (allowSelfSigned && isRediss) {
      socketOptions.tls = { rejectUnauthorized: false };
      logger.warn(
        'TLS certificate verification disabled for Redis connection only. This should only be used temporarily in development.',
      );
    }

    const clientConfig = {
      url: redisUrl,
      socket: socketOptions,
    };

    redisClient = createRedisClient(clientConfig) as RedisClientType;

    // Lazy connect
    redisClient.connect().catch(() => {});

    redisClient.on('ready', () => logger.info('Redis session client ready'));
    redisClient.on('error', (err) => {
      if (err && err.code === 'SELF_SIGNED_CERT_IN_CHAIN' && isRediss && !allowSelfSigned) {
        logger.error(
          {
            err,
            hint: 'Detected self-signed certificate from Redis. If this is intentional (dev tunnel), set REDIS_ALLOW_SELF_SIGNED=true temporarily.',
          },
          'Redis session client error',
        );
      } else {
        logger.error({ err }, 'Redis session client error');
      }
    });
    redisClient.on('reconnecting', () => logger.warn('Redis session client reconnecting'));
    redisClient.on('end', () => logger.warn('Redis session client ended'));

    store = createRedisSessionStore(redisClient);
  }

  // Session middleware
  app.use('*', async (c: Context, next: Next) => {
    let sessionId = getCookie(c, SESSION_COOKIE_NAME);
    let session: SessionData = {};

    // Get existing session or create new
    if (sessionId) {
      const existingSession = await store.get(sessionId);
      if (existingSession) {
        session = existingSession;
      } else {
        // Session expired or invalid, generate new ID
        sessionId = crypto.randomUUID();
      }
    } else {
      sessionId = crypto.randomUUID();
    }

    // Set session in context
    c.set('session', session);
    c.set('sessionId', sessionId);

    await next();

    // After response, save session if modified
    const updatedSession = c.get('session') as SessionData;

    // Check if session was cleared (logout)
    if (!updatedSession || Object.keys(updatedSession).length === 0) {
      await store.destroy(sessionId);
      deleteCookie(c, SESSION_COOKIE_NAME);
    } else {
      // Save session
      await store.set(sessionId, updatedSession, SESSION_MAX_AGE);

      // Set cookie
      setCookie(c, SESSION_COOKIE_NAME, sessionId, {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'Lax',
        maxAge: SESSION_MAX_AGE / 1000, // in seconds
      });
    }
  });
}
