import { z } from "zod";

const BOOL_ENV = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true" || v === "1"));

const BOT_ENABLED_SCHEMA = BOOL_ENV.transform((v) =>
  v === undefined ? true : v
);
const WEB_ENABLED_SCHEMA = BOOL_ENV.transform((v) =>
  v === undefined ? true : v
);

export const EnvSchema = z
  .object({
    BOT_TOKEN: z.string().optional(),
    BOT_ENABLED: BOT_ENABLED_SCHEMA,
    WEB_ENABLED: WEB_ENABLED_SCHEMA,
    CATAPI_KEY: z.string().min(1, "CATAPI_KEY is required"),
    WEBSITE_URL: z.string().url().default("http://localhost"),
    PORT: z
      .string()
      .regex(/^\d+$/)
      .transform((v) => parseInt(v, 10))
      .default("5200"),
    SESSION_SECRET: z.string().min(10).default("your-secret-key-here"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    REDIS_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
  })
  .superRefine((env, ctx) => {
    const botEnabled = env.BOT_ENABLED ?? true;
    if (botEnabled && !env.BOT_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "BOT_TOKEN is required when BOT_ENABLED=true",
        path: ["BOT_TOKEN"],
      });
    }
    if (env.NODE_ENV === "production") {
      if (
        !env.SESSION_SECRET ||
        env.SESSION_SECRET === "your-secret-key-here"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "SESSION_SECRET must be explicitly set in production (not the default)",
          path: ["SESSION_SECRET"],
        });
      }
      if (!env.REDIS_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "REDIS_URL is required in production",
          path: ["REDIS_URL"],
        });
      }
      if (!env.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DATABASE_URL is required in production",
          path: ["DATABASE_URL"],
        });
      }
    }
  });

export default EnvSchema;
