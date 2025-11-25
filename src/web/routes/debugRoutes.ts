import { Router, Request, Response } from 'express';

export function setupDebugRoutes(router: Router) {
  // NOTE: This endpoint exposes sensitive session data.
  // In production, wrap with NODE_ENV check or remove entirely.
  router.get('/debug-session', (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Debug endpoint disabled in production' });
      return;
    }
    // Возвращает диагностическую информацию по текущей сессии и запросу
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      sessionUser: req.session.user,
      cookieSettings: req.session.cookie,
      headers: req.headers,
      secure: req.secure,
    });
  });
}
