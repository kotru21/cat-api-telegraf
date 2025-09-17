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
    const redisUrl = config.REDIS_URL || process.env.REDIS_URL;
    const allowSelfSigned =
      config.REDIS_ALLOW_SELF_SIGNED ||
      process.env.REDIS_ALLOW_SELF_SIGNED === "true";
    const isRediss = redisUrl.startsWith("rediss://");
    const redisClient = createRedisClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
        tls: isRediss
          ? {
              rejectUnauthorized: !allowSelfSigned,
            }
          : undefined,
      },
    });
    // Lazy connect; errors are handled by redis client
    redisClient.connect().catch(() => {});
    // Логи Redis клиента
    if (isRediss && allowSelfSigned) {
      logger.warn(
        {
          redisUrl,
          securityWarning:
            "TLS certificate verification is DISABLED for Redis (self-signed allowed). Do NOT use this permanently in production.",
        },
        "Redis session client: self-signed certificate allowed"
      );
    }
    redisClient.on("ready", () => logger.info("Redis session client ready"));
    redisClient.on("error", (err) => {
      if (
        err &&
        err.code === "SELF_SIGNED_CERT_IN_CHAIN" &&
        isRediss &&
        !allowSelfSigned
      ) {
        logger.error(
          {
            err,
            hint: "Detected self-signed certificate from Redis. If this is intentional (dev tunnel), set REDIS_ALLOW_SELF_SIGNED=true temporarily. Prefer configuring a proper CA cert instead.",
          },
          "Redis session client error"
        );
      } else {
        logger.error({ err }, "Redis session client error");
      }
    });
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
