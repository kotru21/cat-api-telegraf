import { Express, Request, Response } from 'express';
import logger from '../../utils/logger.js';
import { AuthService, TelegramAuthData } from '../../services/AuthService.js';
import { Config } from '../../config/types.js';

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

  setupRoutes(app: Express) {
    app.get('/auth/telegram/callback', this.handleTelegramCallback.bind(this));
    app.post('/auth/telegram/callback', this.handleTelegramCallbackPost.bind(this));
  }

  /**
   * Core authentication logic shared between GET and POST handlers
   */
  private async processAuth(
    req: Request,
    authData: TelegramAuthData,
    responseType: AuthResponseType,
    route: string,
  ): Promise<AuthResult> {
    const startTs = Date.now();

    logger.info(
      {
        route,
        dataKeys: Object.keys(authData),
        hasSession: !!req.session,
      },
      'Auth callback received',
    );

    const validation = this.authService.validateTelegramData(authData);

    if (!validation.isValid) {
      logger.warn({ reason: validation.error }, `Auth callback validation failed (${route})`);
      return { success: false, error: validation.error ?? undefined };
    }

    // Set user session
    req.session.user = {
      id: authData.id,
      first_name: authData.first_name,
      last_name: authData.last_name ?? undefined,
      username: authData.username ?? undefined,
      photo_url: authData.photo_url ?? undefined,
    };

    // Save session with timeout
    const timeoutMs = 5000;
    try {
      await this.saveSessionWithTimeout(req, timeoutMs);
      logger.info({ elapsed: Date.now() - startTs }, `Auth callback session saved (${route})`);
      return { success: true, redirect: '/profile' };
    } catch (e) {
      const err = e as Error;
      logger.error({ err: e }, `Auth callback session save failed (${route})`);
      const errorCode =
        err.message === 'session_save_timeout' ? 'session_timeout' : 'session_error';
      return { success: false, error: errorCode };
    }
  }

  /**
   * Saves session with a timeout to prevent hanging
   */
  private saveSessionWithTimeout(req: Request, timeoutMs: number): Promise<void> {
    return Promise.race([
      new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('session_save_timeout')), timeoutMs),
      ),
    ]);
  }

  async handleTelegramCallback(req: Request, res: Response) {
    try {
      const authData = req.query as unknown as TelegramAuthData;
      const result = await this.processAuth(
        req,
        authData,
        'redirect',
        'GET /auth/telegram/callback',
      );

      if (!result.success) {
        return res.redirect(`/login?error=${result.error}`);
      }
      return res.redirect(result.redirect!);
    } catch (error) {
      logger.error({ err: error }, 'Auth callback fatal error');
      res.redirect('/login?error=auth_failed');
    }
  }

  async handleTelegramCallbackPost(req: Request, res: Response) {
    try {
      const authData = req.body as TelegramAuthData;
      const result = await this.processAuth(req, authData, 'json', 'POST /auth/telegram/callback');

      if (!result.success) {
        return res.status(403).json({ error: result.error });
      }
      return res.status(200).json({ success: true, redirect: result.redirect });
    } catch (error) {
      logger.error({ err: error }, 'Auth callback POST fatal error');
      res.status(500).json({ error: 'auth_failed' });
    }
  }
}
