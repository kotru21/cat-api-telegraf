import { Hono, Context, MiddlewareHandler } from 'hono';
import logger from '../../utils/logger.js';
import { CatInfoService } from '../../services/CatInfoService.js';
import { LikeService } from '../../services/LikeService.js';
import { LeaderboardService } from '../../services/LeaderboardService.js';
import { toCatDto } from '../dto/CatDto.js';
import { toLeaderboardDto } from '../dto/LeaderboardDto.js';
import { SessionData } from '../../types/hono.js';

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
  router.get('/cat/:id', async (c: Context) => {
    const id = c.req.param('id');
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return c.json({ error: 'Invalid ID format' }, 400);
    }

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
  router.get('/similar', async (c: Context) => {
    const feature = c.req.query('feature');
    const value = c.req.query('value');

    if (!feature || !value) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    const cats = await catInfoService.getCatsByFeature(feature, value);
    return c.json(cats);
  });

  // GET /random-images — random images
  router.get('/random-images', async (c: Context) => {
    const count = parseInt(c.req.query('count') || '3');
    const images = await catInfoService.getRandomImages(count);
    return c.json(images);
  });

  // POST /like — add like
  router.post('/like', requireAuth, async (c: Context) => {
    const body = await c.req.json();
    const { catId } = body;
    const session = c.get('session') as SessionData;
    const userId = session.user!.id.toString();

    if (!catId) {
      return c.json({ error: 'catId is required' }, 400);
    }

    logger.debug({ catId, userId }, 'Attempt to add like');

    const result = await likeService.addLikeToCat(catId, userId);

    if (result === false) {
      return c.json({ success: false, message: 'Already liked or failed' });
    }

    return c.json({ success: true });
  });

  // DELETE /like — remove like
  router.delete('/like', requireAuth, async (c: Context) => {
    const body = await c.req.json();
    const { catId } = body;
    const session = c.get('session') as SessionData;
    const userId = session.user!.id.toString();

    if (!catId) {
      return c.json({ error: 'catId is required' }, 400);
    }

    logger.debug({ catId, userId }, 'Attempt to remove like');

    const result = await likeService.removeLikeFromCat(catId, userId);

    if (result === false) {
      return c.json({ error: 'Like not found or already removed' }, 404);
    }

    logger.info({ catId, userId }, 'Like removed successfully');
    return c.json({ ok: true });
  });
}
