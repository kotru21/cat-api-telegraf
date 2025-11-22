import { Router, Request, Response, NextFunction } from "express";
import logger from "../../utils/logger.js";
import { CatInfoService } from "../../services/CatInfoService.js";
import { LikeService } from "../../services/LikeService.js";
import { LeaderboardService } from "../../services/LeaderboardService.js";

export function setupCatRoutes(
  router: Router,
  {
    catInfoService,
    likeService,
    leaderboardService,
    requireAuth,
    leaderboardLimiter,
  }: {
    catInfoService: CatInfoService;
    likeService: LikeService;
    leaderboardService: LeaderboardService;
    requireAuth: any;
    leaderboardLimiter: any;
  }
) {
  // GET /cat/:id — fetch cat by id
  router.get(
    "/cat/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params.id;
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }

        const catData = await catInfoService.getCatById(id);
        if (!catData) {
          return res.status(404).json({ error: "Cat not found" });
        }
        res.json(catData);
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /leaderboard — fetch leaderboard
  router.get(
    "/leaderboard",
    leaderboardLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const rows = await leaderboardService.getLeaderboard(10);
        res.json(rows);
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /similar — filter cats by feature
  router.get(
    "/similar",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { feature, value } = req.query;

        if (!feature || !value) {
          return res.status(400).json({ error: "Missing required parameters" });
        }

        const cats = await catInfoService.getCatsByFeature(
          feature as string,
          value as string
        );
        res.json(cats);
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /random-images — random images
  router.get(
    "/random-images",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const count = parseInt(req.query.count as string) || 3;
        const images = await catInfoService.getRandomImages(count);
        res.json(images);
      } catch (err) {
        next(err);
      }
    }
  );

  // DELETE /like — remove like
  router.delete(
    "/like",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { catId } = req.body;
        const userId = (req.session as any).user.id.toString();

        if (!catId) {
          return res.status(400).json({ error: "catId is required" });
        }

        logger.debug({ catId, userId }, "Attempt to remove like");

        const result = await likeService.removeLikeFromCat(catId, userId);

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
    }
  );
}
