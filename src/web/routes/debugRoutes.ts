import { Hono, Context } from 'hono';
import { SessionData } from '../../types/hono.js';

export function setupDebugRoutes(router: Hono) {
  // NOTE: This endpoint exposes sensitive session data.
  // In production, this endpoint is disabled.
  router.get('/debug-session', (c: Context) => {
    if (process.env.NODE_ENV === 'production') {
      return c.json({ error: 'Debug endpoint disabled in production' }, 403);
    }

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
