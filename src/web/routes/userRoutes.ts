import { Router, Request, Response, NextFunction } from "express";
import { LikeService } from "../../services/LikeService.js";

export function setupUserRoutes(
  router: Router,
  { likeService, requireAuth }: { likeService: LikeService; requireAuth: any }
) {
  // Получение профиля пользователя
  router.get("/profile", requireAuth, (req: Request, res: Response) => {
    res.json((req.session as any).user);
  });

  // Получение лайкнутых котов пользователя
  router.get(
    "/mylikes",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.session as any).user.id.toString();
        const userLikes = await likeService.getUserLikes(userId);
        res.json(userLikes);
      } catch (err) {
        next(err);
      }
    }
  );

  // Получение количества лайков
  router.get(
    "/user/likes/count",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.session as any).user.id.toString();
        const count = await likeService.getUserLikesCount(userId);
        res.json({ count });
      } catch (err) {
        next(err);
      }
    }
  );
}
