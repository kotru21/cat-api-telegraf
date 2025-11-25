import helmet from 'helmet';
import cors from 'cors';
import express, { Express, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generates a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * CSP nonce middleware - adds nonce to res.locals for use in templates
 */
function cspNonceMiddleware(req: Request, res: Response, next: NextFunction) {
  res.locals.cspNonce = generateNonce();
  next();
}

export function setupSecurity(app: Express) {
  // Add nonce middleware before helmet
  app.use(cspNonceMiddleware);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const nonce = res.locals.cspNonce;

    const helmetOpts = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            `'nonce-${nonce}'`,
            // Alpine.js requires unsafe-eval for dynamic expression evaluation
            "'unsafe-eval'",
            'cdnjs.cloudflare.com',
            'telegram.org',
            '*.telegram.org',
            't.me',
            'oauth.telegram.org',
          ],
          styleSrc: [
            "'self'",
            // Tailwind and Alpine.js dynamic styles require unsafe-inline
            // Note: nonce is NOT included here because it would disable unsafe-inline
            "'unsafe-inline'",
            'cdnjs.cloudflare.com',
            '*.telegram.org',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'telegram.org',
            '*.telegram.org',
            't.me',
            'placehold.co',
            'cdn2.thecatapi.com',
            'https://*',
          ],
          connectSrc: [
            "'self'",
            'ws:',
            'wss:',
            'telegram.org',
            '*.telegram.org',
            'oauth.telegram.org',
          ],
          fontSrc: ["'self'", 'cdnjs.cloudflare.com'],
          objectSrc: ["'none'"],
          frameSrc: ["'self'", 'telegram.org', '*.telegram.org', 't.me', 'oauth.telegram.org'],
          formAction: ["'self'", 'telegram.org', '*.telegram.org', 'oauth.telegram.org'],
          baseUri: ["'self'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' as const },
      crossOriginResourcePolicy: { policy: 'cross-origin' as const },
      referrerPolicy: {
        policy: ['origin', 'strict-origin-when-cross-origin'] as const,
      },
      xFrameOptions: false,
      hsts: process.env.NODE_ENV === 'production',
      xPoweredBy: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- helmet options type is complex
    helmet(helmetOpts as any)(req, res, next);
  });

  app.use(cors({ origin: true, credentials: true }));

  app.use(express.json());
}

export { generateNonce };
