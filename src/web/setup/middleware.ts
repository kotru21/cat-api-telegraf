import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import logger from '../../utils/logger.js';
import { setupSession } from '../middleware/session.js';
import { csrfProtection } from '../middleware/csrf.js';
import { Config } from '../../config/types.js';

/**
 * Generates a cryptographically secure nonce using Web Crypto API
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function configureMiddleware(app: Hono, config: Config) {
  // CSP nonce middleware
  app.use('*', async (c: Context, next: Next) => {
    const nonce = generateNonce();
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

  // CORS with origin whitelist in production
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = config.FULL_WEBSITE_URL
    ? [config.FULL_WEBSITE_URL, config.WEBSITE_URL].filter(Boolean)
    : [];

  app.use(
    '*',
    cors({
      origin: (origin) => {
        // In production, validate against whitelist
        if (isProd && allowedOrigins.length > 0) {
          if (!origin) return allowedOrigins[0]; // Default for same-origin requests
          return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
        }
        // In development, allow all origins
        return origin || '*';
      },
      credentials: true,
    }),
  );

  // Session management
  setupSession(app, config);

  // CSRF protection (after session, before routes)
  // Exclude webhook endpoints and public API endpoints that use other auth
  app.use(
    '*',
    csrfProtection({
      excludePaths: [
        '/api/auth/telegram', // Telegram OAuth callback uses its own validation
        '/wss', // WebSocket endpoint
      ],
    }),
  );

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
