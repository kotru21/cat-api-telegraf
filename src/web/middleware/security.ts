import helmet from 'helmet';
import cors from 'cors';
import express, { Express } from 'express';

export function setupSecurity(app: Express) {
  const helmetOpts = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'cdn.tailwindcss.com',
          'cdnjs.cloudflare.com',
          'telegram.org',
          '*.telegram.org',
          't.me',
          'oauth.telegram.org',
          'placehold.co',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'cdn.tailwindcss.com',
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
  app.use(helmet(helmetOpts as any));

  app.use(cors({ origin: true, credentials: true }));

  app.use(express.json());
}
