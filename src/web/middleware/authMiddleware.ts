import { Context, Next, MiddlewareHandler } from 'hono';
import { SessionData } from '../../types/hono.js';

export function setupAuthMiddleware(): { requireAuth: MiddlewareHandler } {
  // Middleware для проверки авторизации
  const requireAuth: MiddlewareHandler = async (c: Context, next: Next) => {
    const session = c.get('session') as SessionData | undefined;

    if (!session || !session.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  };

  return { requireAuth };
}
