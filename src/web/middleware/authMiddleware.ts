import { Request, Response, NextFunction, RequestHandler } from 'express';

export function setupAuthMiddleware(): { requireAuth: RequestHandler } {
  // Middleware для проверки авторизации
  const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };

  return { requireAuth };
}
