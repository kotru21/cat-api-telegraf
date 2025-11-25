import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import crypto from 'crypto';
import logger from '../../utils/logger.js';
import { setupSession } from '../middleware/session.js';
import { Config } from '../../config/types.js';

export function configureMiddleware(app: Hono, config: Config) {
  // CSP nonce middleware
  app.use('*', async (c: Context, next: Next) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    c.set('cspNonce', nonce);
    await next();
  });

  // Security headers with CSP
  app.use('*', async (c: Context, next: Next) => {
    const nonce = c.get('cspNonce') || '';
    const isProd = process.env.NODE_ENV === 'production';

    // Set security headers manually for fine-grained control
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Download-Options', 'noopen');
    c.header('X-XSS-Protection', '0');
    c.header('Referrer-Policy', 'origin, strict-origin-when-cross-origin');
    c.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    c.header('Cross-Origin-Resource-Policy', 'cross-origin');

    if (isProd) {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // CSP header
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' cdnjs.cloudflare.com telegram.org *.telegram.org t.me oauth.telegram.org`,
      "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com *.telegram.org",
      "img-src 'self' data: telegram.org *.telegram.org t.me placehold.co cdn2.thecatapi.com https://*",
      "connect-src 'self' ws: wss: telegram.org *.telegram.org oauth.telegram.org",
      "font-src 'self' cdnjs.cloudflare.com",
      "object-src 'none'",
      "frame-src 'self' telegram.org *.telegram.org t.me oauth.telegram.org",
      "form-action 'self' telegram.org *.telegram.org oauth.telegram.org",
      "base-uri 'self'",
      isProd ? 'upgrade-insecure-requests' : '',
    ]
      .filter(Boolean)
      .join('; ');

    c.header('Content-Security-Policy', cspDirectives);

    await next();
  });

  // CORS
  app.use(
    '*',
    cors({
      origin: (origin) => origin || '*',
      credentials: true,
    }),
  );

  // Session management
  setupSession(app, config);

  // Request logging - use custom middleware for Hono
  app.use('*', async (c: Context, next: Next) => {
    const start = Date.now();
    const requestId = c.req.header('x-request-id') || crypto.randomUUID();

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    logger[logLevel](
      {
        req: {
          method: c.req.method,
          url: c.req.url,
          path: c.req.path,
        },
        res: { statusCode: status },
        responseTime: duration,
        requestId,
      },
      `${c.req.method} ${c.req.path} ${status} ${duration}ms`,
    );
  });

  // JSON body parsing is handled by Hono automatically via c.req.json()
}
