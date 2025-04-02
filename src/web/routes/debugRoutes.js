export function setupDebugRoutes(router) {
  router.get("/debug-session", (req, res) => {
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
