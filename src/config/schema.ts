import { z } from 'zod';

const BOOL_ENV = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true' || v === '1'));

const BOT_ENABLED_SCHEMA = BOOL_ENV.transform((v) => (v === undefined ? true : v));
const WEB_ENABLED_SCHEMA = BOOL_ENV.transform((v) => (v === undefined ? true : v));
const REDIS_ENABLED_SCHEMA = BOOL_ENV.transform((v) => (v === undefined ? false : v));

export const EnvSchema = z
  .object({
    BOT_TOKEN: z.string().optional(),
    BOT_ENABLED: BOT_ENABLED_SCHEMA,
    WEB_ENABLED: WEB_ENABLED_SCHEMA,
    CATAPI_KEY: z.string().min(1, 'CATAPI_KEY is required'),
    WEBSITE_URL: z.string().url().default('http://localhost'),
    PORT: z
      .string()
      .regex(/^\d+$/)
      .transform((v) => parseInt(v, 10))
      .default(5200),
    SESSION_SECRET: z.string().min(10),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Redis configuration
    REDIS_ENABLED: REDIS_ENABLED_SCHEMA,
    REDIS_URL: z.string().url().optional(),
    // Разрешить отключение проверки TLS для self-signed (rediss://). Использовать ТОЛЬКО временно.
    REDIS_ALLOW_SELF_SIGNED: BOOL_ENV.optional(),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    // WebSocket configuration
    WS_MAX_CONNECTIONS_PER_IP: z.coerce.number().int().positive().default(5),
    WS_MESSAGE_RATE_LIMIT: z.coerce.number().int().positive().default(10),
  })
  .superRefine((env, ctx) => {
    const botEnabled = env.BOT_ENABLED ?? true;
    if (botEnabled && !env.BOT_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'BOT_TOKEN is required when BOT_ENABLED=true',
        path: ['BOT_TOKEN'],
      });
    }

    // REDIS_ENABLED=true требует REDIS_URL
    if (env.REDIS_ENABLED && !env.REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'REDIS_URL is required when REDIS_ENABLED=true',
        path: ['REDIS_URL'],
      });
    }

    if (env.NODE_ENV === 'production') {
      // in production we must use Postgres
      const v = env.DATABASE_URL || '';
      if (!v.startsWith('postgres://') && !v.startsWith('postgresql://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL must start with postgres:// or postgresql:// in production',
          path: ['DATABASE_URL'],
        });
      }

      // SESSION_SECRET обязателен (нет дефолтного значения)
      if (!env.SESSION_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET is required',
          path: ['SESSION_SECRET'],
        });
      }

      // В production рекомендуется Redis, но не обязателен
      // Если REDIS_ENABLED=true, то REDIS_URL уже проверен выше
    }
  });

export type AppConfig = z.infer<typeof EnvSchema>;

export default EnvSchema;
