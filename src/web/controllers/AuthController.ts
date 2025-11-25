import { Hono, Context } from 'hono';
import logger from '../../utils/logger.js';
import { AuthService, TelegramAuthData } from '../../services/AuthService.js';
import { Config } from '../../config/types.js';
import { SessionData } from '../../types/hono.js';

type AuthResponseType = 'redirect' | 'json';

interface AuthResult {
  success: boolean;
  error?: string;
  redirect?: string;
}

export class AuthController {
  private config: Config;
  private authService: AuthService;

  constructor({ config, authService }: { config: Config; authService: AuthService }) {
    this.config = config;
    this.authService = authService;
  }

  setupRoutes(app: Hono) {
    app.get('/auth/telegram/callback', this.handleTelegramCallback.bind(this));
    app.post('/auth/telegram/callback', this.handleTelegramCallbackPost.bind(this));
  }

  /**
   * Core authentication logic shared between GET and POST handlers
   */
  private async processAuth(
    c: Context,
    authData: TelegramAuthData,
    responseType: AuthResponseType,
    route: string,
  ): Promise<AuthResult> {
    const startTs = Date.now();

    logger.info(
      {
        route,
        dataKeys: Object.keys(authData),
        hasSession: !!c.get('session'),
      },
      'Auth callback received',
    );

    const validation = this.authService.validateTelegramData(authData);

    if (!validation.isValid) {
      logger.warn({ reason: validation.error }, `Auth callback validation failed (${route})`);
      return { success: false, error: validation.error ?? undefined };
    }

    // Set user session
    const session = (c.get('session') as SessionData) || {};
    session.user = {
      id: authData.id,
      first_name: authData.first_name,
      last_name: authData.last_name ?? undefined,
      username: authData.username ?? undefined,
      photo_url: authData.photo_url ?? undefined,
    };
    c.set('session', session);

    logger.info({ elapsed: Date.now() - startTs }, `Auth callback session saved (${route})`);
    return { success: true, redirect: '/profile' };
  }

  async handleTelegramCallback(c: Context) {
    try {
      // Get auth data from query parameters
      const authData: TelegramAuthData = {
        id: c.req.query('id') || '',
        first_name: c.req.query('first_name'),
        last_name: c.req.query('last_name'),
        username: c.req.query('username'),
        photo_url: c.req.query('photo_url'),
        auth_date: c.req.query('auth_date') || '',
        hash: c.req.query('hash') || '',
      };

      const result = await this.processAuth(c, authData, 'redirect', 'GET /auth/telegram/callback');

      if (!result.success) {
        return c.redirect(`/login?error=${result.error}`);
      }
      return c.redirect(result.redirect!);
    } catch (error) {
      logger.error({ err: error }, 'Auth callback fatal error');
      return c.redirect('/login?error=auth_failed');
    }
  }

  async handleTelegramCallbackPost(c: Context) {
    try {
      const authData = (await c.req.json()) as TelegramAuthData;
      const result = await this.processAuth(c, authData, 'json', 'POST /auth/telegram/callback');

      if (!result.success) {
        return c.json({ error: result.error }, 403);
      }
      return c.json({ success: true, redirect: result.redirect });
    } catch (error) {
      logger.error({ err: error }, 'Auth callback POST fatal error');
      return c.json({ error: 'auth_failed' }, 500);
    }
  }
}
