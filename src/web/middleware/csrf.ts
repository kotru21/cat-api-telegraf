import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import logger from '../../utils/logger.js';

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// Methods that don't require CSRF protection (safe methods)
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Generates a cryptographically secure CSRF token
 */
function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF protection middleware
 *
 * For safe methods (GET, HEAD, OPTIONS):
 * - Generates and sets CSRF token in cookie if not present
 * - Stores token in context for use in templates
 *
 * For state-changing methods (POST, PUT, DELETE, PATCH):
 * - Validates CSRF token from header against cookie
 * - Rejects request if token is missing or invalid
 *
 * @param options Configuration options
 * @param options.excludePaths Paths to exclude from CSRF protection (e.g., webhook endpoints)
 */
export function csrfProtection(options: { excludePaths?: string[] } = {}) {
  const excludePaths = new Set(options.excludePaths || []);

  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;
    const method = c.req.method.toUpperCase();

    // Skip CSRF for excluded paths (webhooks, API tokens, etc.)
    if (excludePaths.has(path)) {
      await next();
      return;
    }

    // Get or generate CSRF token
    let csrfToken = getCookie(c, CSRF_COOKIE_NAME);

    if (!csrfToken) {
      csrfToken = generateCsrfToken();
    }

    // For safe methods, just ensure the token exists
    if (SAFE_METHODS.has(method)) {
      // Set/refresh the CSRF cookie
      const isProd = process.env.NODE_ENV === 'production';
      setCookie(c, CSRF_COOKIE_NAME, csrfToken, {
        path: '/',
        httpOnly: false, // Must be accessible by JavaScript
        secure: isProd,
        sameSite: 'Strict',
        maxAge: CSRF_COOKIE_MAX_AGE,
      });

      // Store token in context for use in templates
      c.set('csrfToken', csrfToken);

      await next();
      return;
    }

    // For state-changing methods, validate the token
    const headerToken = c.req.header(CSRF_HEADER_NAME);

    if (!headerToken || !csrfToken) {
      logger.warn(
        {
          path,
          method,
          hasHeaderToken: !!headerToken,
          hasCookieToken: !!csrfToken,
        },
        'CSRF token missing',
      );

      return c.json(
        {
          error: 'CSRF token missing',
          code: 'CSRF_TOKEN_MISSING',
        },
        403,
      );
    }

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(headerToken, csrfToken)) {
      logger.warn(
        {
          path,
          method,
        },
        'CSRF token mismatch',
      );

      return c.json(
        {
          error: 'CSRF token invalid',
          code: 'CSRF_TOKEN_INVALID',
        },
        403,
      );
    }

    // Token is valid, continue
    c.set('csrfToken', csrfToken);
    await next();
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Helper to get CSRF token for API responses
 * Can be called from routes to include token in JSON responses
 */
export function getCsrfTokenFromContext(c: Context): string | undefined {
  return c.get('csrfToken');
}
