import { Hono, Context } from 'hono';
import { AuthService, TelegramAuthData } from '../../services/AuthService.js';
import { SessionData } from '../../types/hono.js';

export function setupAuthRoutes(router: Hono, { authService }: { authService: AuthService }) {
  router.post('/auth/telegram', async (c: Context) => {
    try {
      // Extract fields from request body sent by Telegram Login Widget
      const body = (await c.req.json()) as TelegramAuthData;
      const { id, first_name, username, photo_url, auth_date, hash } = body;

      // Validate hash signature per Bot API
      const validation = authService.validateTelegramData({
        id,
        first_name,
        username,
        photo_url,
        auth_date,
        hash,
      });

      if (!validation.isValid) {
        return c.json({ error: validation.error || 'Invalid authentication data' }, 401);
      }

      // Save user to session
      const session = c.get('session') as SessionData;
      session.user = {
        id,
        first_name,
        username,
        photo_url,
      };
      c.set('session', session);

      return c.json({ success: true, redirect: '/profile' });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });
}
