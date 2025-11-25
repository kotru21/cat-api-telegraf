declare module 'telegraf-ratelimit' {
  import { Context, Middleware } from 'telegraf';

  export interface RateLimitConfig {
    /** Временное окно в миллисекундах */
    window: number;
    /** Максимальное количество сообщений в окне */
    limit: number;
    /** Callback при превышении лимита */
    onLimitExceeded?: (ctx: Context, next: () => Promise<void>) => void | Promise<void>;
    /** Ключ для идентификации пользователя (по умолчанию ctx.from.id) */
    keyGenerator?: (ctx: Context) => string | number | undefined;
  }

  /**
   * Creates a rate limiting middleware for Telegraf
   */
  function rateLimit(config: RateLimitConfig): Middleware<Context>;

  export default rateLimit;
}
