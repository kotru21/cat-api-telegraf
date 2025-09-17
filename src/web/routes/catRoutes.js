import { executeUseCase } from "../../application/context.js";
import logger from "../../utils/logger.js";
import {
  likeCat,
  unlikeCat,
  getCatDetails,
  getLeaderboard,
  getCatsByFeature,
  getRandomImages,
  getUserLikes,
  getUserLikesCount,
} from "../../application/use-cases/index.js";
export function setupCatRoutes(
  router,
  { catService, requireAuth, leaderboardLimiter }
) {
  const appCtx = { catService };

  /**
   * Безопасное выполнение use-case для веб-роутов
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
  // GET /cat/:id — fetch cat by id
  router.get("/cat/:id", async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const catData = await executeUseCaseWeb(getCatDetails, { id }, req);
      res.json(catData);
    } catch (err) {
      next(err);
    }
  });

  // GET /leaderboard — fetch leaderboard
  router.get("/leaderboard", leaderboardLimiter, async (req, res, next) => {
    try {
      const rows = await executeUseCaseWeb(getLeaderboard, {}, req);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  // GET /similar — filter cats by feature
  router.get("/similar", async (req, res, next) => {
    try {
      const { feature, value } = req.query;

      if (!feature || !value) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const cats = await executeUseCaseWeb(
        getCatsByFeature,
        {
          feature,
          value,
        },
        req
      );
      res.json(cats);
    } catch (err) {
      next(err);
    }
  });

  // GET /random-images — random images
  router.get("/random-images", async (req, res, next) => {
    try {
      const count = parseInt(req.query.count) || 3;
      const images = await executeUseCaseWeb(getRandomImages, { count }, req);
      res.json(images);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /like — remove like
  router.delete("/like", requireAuth, async (req, res, next) => {
    try {
      const { catId } = req.body;
      const userId = req.session.user.id.toString();

      if (!catId) {
        return res.status(400).json({ error: "catId is required" });
      }

      logger.debug({ catId, userId }, "Attempt to remove like");

      const result = await executeUseCaseWeb(unlikeCat, { catId, userId }, req);

      if (result === false) {
        return res
          .status(404)
          .json({ error: "Like not found or already removed" });
      }

      logger.info({ catId, userId }, "Like removed successfully");
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });
}
