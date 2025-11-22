import { Request, Response, NextFunction } from "express";

export function setupAuthMiddleware() {
  // Middleware для проверки авторизации
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  return { requireAuth };
}
