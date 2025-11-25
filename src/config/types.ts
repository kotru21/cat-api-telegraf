import { z } from 'zod';
import { EnvSchema } from './schema.js';

/**
 * Raw environment configuration from Zod schema
 */
export type AppConfig = z.infer<typeof EnvSchema>;

/**
 * Processed application configuration
 * This is the shape of the config object used throughout the app
 */
export interface Config {
  BOT_TOKEN?: string;
  BOT_ENABLED: boolean;
  WEB_ENABLED: boolean;
  CAT_API_TOKEN: string;
  expressServerPort: number;
  websocketServerPort: number;
  apiPort: number;
  WEBSITE_URL: string;
  FULL_WEBSITE_URL: string;
  SESSION_SECRET: string;
  NODE_ENV: 'development' | 'test' | 'production';
  REDIS_URL?: string;
  REDIS_ALLOW_SELF_SIGNED?: boolean;
  DATABASE_URL: string;
}
