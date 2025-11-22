import { Express } from "express";
import session from "express-session";
import { createClient as createRedisClient } from "redis";
import { RedisStore } from "connect-redis";
import logger from "../../utils/logger.js";

export function setupSession(app: Express, config: any) {
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
    // Поведение redis@5: если URL rediss:// — TLS включается автоматически.
    // Ошибка "tls socket option is set ... mismatch with protocol" возникает при одновременном указании rediss:// и несовместимых tls опций.
    // Стратегия:
    // 1. Если strict TLS (по умолчанию) — НЕ указывать socket.tls вообще.
    // 2. Если разрешён self-signed — указываем socket.tls = { rejectUnauthorized:false }.
    const socketOptions = {
      reconnectStrategy: (r: number) => Math.min(r * 50, 2000),
    };

    // Если разрешены самоподписанные сертификаты, отключаем проверку TLS глобально
    if (allowSelfSigned && isRediss) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      logger.warn(
        "TLS certificate verification disabled globally for Redis connection. This should only be used temporarily."
      );
    }

    const clientConfig = {
      url: redisUrl,
      socket: socketOptions,
    };

    const redisClient = createRedisClient(clientConfig);
    // Lazy connect; errors are handled by redis client
    redisClient.connect().catch(() => {});
    // Логи Redis клиента
    if (allowSelfSigned) {
      logger.warn(
        {
          redisUrl,
          securityWarning:
            "TLS certificate verification is DISABLED for Redis (self-signed allowed). Do NOT use this permanently in production.",
        },
        "Redis session client: self-signed certificate allowed"
      );
      if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
        logger.warn(
          "Process-wide TLS verification disabled (NODE_TLS_REJECT_UNAUTHORIZED=0). Consider removing after debugging."
        );
      }
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
