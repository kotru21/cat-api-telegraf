import { Hono, Context } from 'hono';
import { SessionData } from '../../types/hono.js';

/**
 * Setup debug routes (development only)
 * In production, this function returns without registering any routes
 */
export function setupDebugRoutes(router: Hono) {
  // Don't register debug routes in production at all
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // NOTE: This endpoint exposes sensitive session data.
  // Only available in development.
  router.get('/debug-session', (c: Context) => {
    const session = c.get('session') as SessionData | undefined;
    const sessionId = c.get('sessionId') as string | undefined;

    // Returns diagnostic information about current session and request
    const headersObj: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    return c.json({
      sessionExists: !!session,
      sessionID: sessionId,
      sessionUser: session?.user,
      headers: headersObj,
    });
  });
}
