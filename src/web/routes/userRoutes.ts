import { Hono, Context, MiddlewareHandler } from 'hono';
import { LikeService } from '../../services/LikeService.js';
import { SessionData } from '../../types/hono.js';

export function setupUserRoutes(
  router: Hono,
  { likeService, requireAuth }: { likeService: LikeService; requireAuth: MiddlewareHandler },
) {
  // Get user profile
  router.get('/profile', requireAuth, (c: Context) => {
    const session = c.get('session') as SessionData;
    return c.json(session.user);
  });

  // Get user's liked cats
  router.get('/mylikes', requireAuth, async (c: Context) => {
    const session = c.get('session') as SessionData;
    const userId = session.user!.id.toString();
    const userLikes = await likeService.getUserLikes(userId);
    return c.json(userLikes);
  });

  // Get likes count
  router.get('/user/likes/count', requireAuth, async (c: Context) => {
    const session = c.get('session') as SessionData;
    const userId = session.user!.id.toString();
    const count = await likeService.getUserLikesCount(userId);
    return c.json({ count });
  });
}
