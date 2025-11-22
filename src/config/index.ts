import { EnvSchema } from './schema.js';

// dotenv.config() is not needed in Bun

const parsed = EnvSchema.safeParse(process.env);
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
  REDIS_URL: env.REDIS_URL,
  REDIS_ALLOW_SELF_SIGNED: env.REDIS_ALLOW_SELF_SIGNED,
  DATABASE_URL: env.DATABASE_URL,
};

// В проде дополнительно проверим SESSION_SECRET, даже несмотря на валидацию zod
if (config.NODE_ENV === 'production' && !config.SESSION_SECRET) {
  console.error('Config validation error: SESSION_SECRET is required in production');
  process.exit(1);
}

export default config;
