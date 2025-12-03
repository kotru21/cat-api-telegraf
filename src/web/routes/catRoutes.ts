import { Hono, Context, MiddlewareHandler } from 'hono';
import { z } from 'zod';
import logger from '../../utils/logger.js';
import { CatInfoService } from '../../services/CatInfoService.js';
import { LikeService } from '../../services/LikeService.js';
import { LeaderboardService } from '../../services/LeaderboardService.js';
import { toCatDto } from '../dto/CatDto.js';
import { toLeaderboardDto } from '../dto/LeaderboardDto.js';
import { SessionData } from '../../types/hono.js';
import { validateBody, validateQuery, validateParams } from '../validation/middleware.js';
import {
  catIdSchema,
  likeBodySchema,
  similarQuerySchema,
  randomImagesQuerySchema,
  LikeBody,
  SimilarQuery,
  RandomImagesQuery,
} from '../validation/schemas.js';

// Param schemas
const catIdParamSchema = z.object({
  id: catIdSchema,
});

export function setupCatRoutes(
  router: Hono,
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
    requireAuth: MiddlewareHandler;
    leaderboardLimiter: MiddlewareHandler;
  },
) {
  // GET /cat/:id — fetch cat by id
  router.get('/cat/:id', validateParams(catIdParamSchema), async (c: Context) => {
    const { id } = c.get('validatedParams') as { id: string };

    const catData = await catInfoService.getCatById(id);
    if (!catData) {
      return c.json({ error: 'Cat not found' }, 404);
    }
    return c.json(toCatDto(catData));
  });

  // GET /leaderboard — fetch leaderboard
  router.get('/leaderboard', leaderboardLimiter, async (c: Context) => {
    const rows = await leaderboardService.getLeaderboard(10);
    return c.json(toLeaderboardDto(rows));
  });

  // GET /similar — filter cats by feature
  router.get('/similar', validateQuery(similarQuerySchema), async (c: Context) => {
    const { feature, value } = c.get('validatedQuery') as SimilarQuery;

    const cats = await catInfoService.getCatsByFeature(feature, value);
    return c.json(cats);
  });

  // GET /random-images — random images
  router.get('/random-images', validateQuery(randomImagesQuerySchema), async (c: Context) => {
    const { count } = c.get('validatedQuery') as RandomImagesQuery;
    const images = await catInfoService.getRandomImages(count);
    return c.json(images);
  });

  // POST /like — add like
  router.post('/like', requireAuth, validateBody(likeBodySchema), async (c: Context) => {
    const { catId } = c.get('validatedBody') as LikeBody;
    const session = c.get('session') as SessionData;
    const userId = session.user!.id.toString();

    logger.debug({ catId, userId }, 'Attempt to add like');

    const result = await likeService.addLikeToCat(catId, userId);

    if (result === false) {
      return c.json({ success: false, message: 'Already liked or failed' });
    }

    return c.json({ success: true });
  });

  // DELETE /like — remove like
  router.delete('/like', requireAuth, validateBody(likeBodySchema), async (c: Context) => {
    const { catId } = c.get('validatedBody') as LikeBody;
    const session = c.get('session') as SessionData;
    const userId = session.user!.id.toString();

    logger.debug({ catId, userId }, 'Attempt to remove like');

    const result = await likeService.removeLikeFromCat(catId, userId);

    if (result === false) {
      return c.json({ error: 'Like not found or already removed' }, 404);
    }

    logger.info({ catId, userId }, 'Like removed successfully');
    return c.json({ ok: true });
  });
}
