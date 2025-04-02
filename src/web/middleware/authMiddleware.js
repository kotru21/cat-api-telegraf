export function setupAuthMiddleware() {
  // Middleware для проверки авторизации
  const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  return { requireAuth };
}
