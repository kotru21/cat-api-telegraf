import { Router, Request, Response, NextFunction } from 'express';
import { LikeService } from '../../services/LikeService.js';

export function setupUserRoutes(
  router: Router,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- express middleware type
  { likeService, requireAuth }: { likeService: LikeService; requireAuth: any },
) {
  // Получение профиля пользователя
  router.get('/profile', requireAuth, (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- express-session types
    res.json((req.session as any).user);
  });

  // Получение лайкнутых котов пользователя
  router.get('/mylikes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- express-session types
      const userId = (req.session as any).user.id.toString();
      const userLikes = await likeService.getUserLikes(userId);
      res.json(userLikes);
    } catch (err) {
      next(err);
    }
  });

  // Получение количества лайков
  router.get(
    '/user/likes/count',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- express-session types
        const userId = (req.session as any).user.id.toString();
        const count = await likeService.getUserLikesCount(userId);
        res.json({ count });
      } catch (err) {
        next(err);
      }
    },
  );
}
