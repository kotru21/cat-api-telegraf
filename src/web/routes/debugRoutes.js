export function setupDebugRoutes(router) {
  router.get("/debug-session", (req, res) => {
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
