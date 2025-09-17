import session from "express-session";
import { createClient as createRedisClient } from "redis";
import { RedisStore } from "connect-redis";
import logger from "../../utils/logger.js";

export function setupSession(app, config) {
  // Production requires explicit secret
  if (process.env.NODE_ENV === "production" && !config.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET is required in production. Please set it via environment variable."
    );
  }
  const isProd = process.env.NODE_ENV === "production";

  let store;
  if (isProd) {
    if (!process.env.REDIS_URL && !config.REDIS_URL) {
      throw new Error("REDIS_URL is required in production for session store.");
    }
    const redisClient = createRedisClient({
      url: config.REDIS_URL || process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
      },
    });
    // Lazy connect; errors are handled by redis client
    redisClient.connect().catch(() => {});
    // Логи Redis клиента
    redisClient.on("ready", () => logger.info("Redis session client ready"));
    redisClient.on("error", (err) =>
      logger.error({ err }, "Redis session client error")
    );
    redisClient.on("reconnecting", () =>
      logger.warn("Redis session client reconnecting")
    );
    redisClient.on("end", () => logger.warn("Redis session client ended"));

    store = new RedisStore({ client: redisClient, prefix: "sess:" });
  }

  app.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        sameSite: "lax",
      },
      proxy: true,
      store,
    })
  );
}
