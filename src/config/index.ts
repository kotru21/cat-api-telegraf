import { EnvSchema } from './schema.js';

// dotenv.config() is not needed in Bun

// Support using MONGODB_URI/MONGODB_URL (Heroku Mongo add-ons) as fallback for DATABASE_URL
const processedEnv = { ...process.env } as NodeJS.ProcessEnv;
if (!processedEnv.DATABASE_URL && (processedEnv.MONGODB_URI || processedEnv.MONGODB_URL)) {
  processedEnv.DATABASE_URL = String(processedEnv.MONGODB_URI || processedEnv.MONGODB_URL);
}

const parsed = EnvSchema.safeParse(processedEnv);
if (!parsed.success) {
  console.error('Config validation error:', parsed.error.flatten());
  process.exit(1);
}

const env = parsed.data;

const PORT = env.PORT;
const WEBSITE_URL = env.WEBSITE_URL.replace(/\/$/, '');

const config = {
  BOT_TOKEN: env.BOT_TOKEN,
  BOT_ENABLED: env.BOT_ENABLED,
  WEB_ENABLED: env.WEB_ENABLED ?? true,
  CAT_API_TOKEN: env.CATAPI_KEY,
  expressServerPort: PORT,
  websocketServerPort: PORT,
  apiPort: PORT,
  WEBSITE_URL,
  FULL_WEBSITE_URL: (() => {
    try {
      const u = new URL(WEBSITE_URL);
      if (!u.port) return `${WEBSITE_URL}:${PORT}`;
      return WEBSITE_URL;
    } catch {
      return WEBSITE_URL;
    }
  })(),
  SESSION_SECRET: env.SESSION_SECRET,
  NODE_ENV: env.NODE_ENV,
  // Redis configuration
  REDIS_ENABLED: env.REDIS_ENABLED,
  REDIS_URL: env.REDIS_URL,
  REDIS_ALLOW_SELF_SIGNED: env.REDIS_ALLOW_SELF_SIGNED,
  DATABASE_URL: env.DATABASE_URL,
  // WebSocket configuration
  WS_MAX_CONNECTIONS_PER_IP: env.WS_MAX_CONNECTIONS_PER_IP,
  WS_MESSAGE_RATE_LIMIT: env.WS_MESSAGE_RATE_LIMIT,
};

// В проде дополнительно проверим SESSION_SECRET, даже несмотря на валидацию zod
if (config.NODE_ENV === 'production' && !config.SESSION_SECRET) {
  console.error('Config validation error: SESSION_SECRET is required in production');
  process.exit(1);
}

export default config;
