import { executeUseCase } from "../../application/context.js";
import {
  getUserLikes,
  getUserLikesCount,
} from "../../application/use-cases/index.js";

export function setupUserRoutes(router, { catService, requireAuth }) {
  const appCtx = { catService };

  /**
   * Безопасное выполнение use-case для пользовательских роутов
   */
  const executeUseCaseWeb = async (useCaseFn, params, req) => {
    const meta = {
      userId: req.session?.user?.id,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      route: req.route?.path,
    };
    return executeUseCase(useCaseFn, appCtx, params, meta);
  };
  // Получение профиля пользователя
  router.get("/profile", requireAuth, (req, res) => {
    res.json(req.session.user);
  });

  // Получение лайкнутых котов пользователя
  router.get("/mylikes", requireAuth, async (req, res, next) => {
    try {
      const userId = req.session.user.id.toString();
      const userLikes = await executeUseCaseWeb(getUserLikes, { userId }, req);
      res.json(userLikes);
    } catch (err) {
      next(err);
    }
  });

  // Получение количества лайков
  router.get("/user/likes/count", requireAuth, async (req, res, next) => {
    try {
      const userId = req.session.user.id.toString();
      const count = await executeUseCaseWeb(getUserLikesCount, { userId }, req);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  });
}
