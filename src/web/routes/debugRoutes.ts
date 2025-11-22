import { Router, Request, Response } from "express";

export function setupDebugRoutes(router: Router) {
  router.get("/debug-session", (req: Request, res: Response) => {
    // Возвращает диагностическую информацию по текущей сессии и запросу
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      sessionUser: (req.session as any).user,
      cookieSettings: req.session.cookie,
      headers: req.headers,
      secure: req.secure,
    });
  });
}
