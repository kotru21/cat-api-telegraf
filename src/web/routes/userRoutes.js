export function setupUserRoutes(router, { likeService, requireAuth }) {
  // Получение профиля пользователя
  router.get("/profile", requireAuth, (req, res) => {
    res.json(req.session.user);
  });

  // Получение лайкнутых котов пользователя
  router.get("/mylikes", requireAuth, async (req, res, next) => {
    try {
      const userId = req.session.user.id.toString();
      const userLikes = await likeService.getUserLikes(userId);
      res.json(userLikes);
    } catch (err) {
      next(err);
    }
  });

  // Получение количества лайков
  router.get("/user/likes/count", requireAuth, async (req, res, next) => {
    try {
      const userId = req.session.user.id.toString();
      const count = await likeService.getUserLikesCount(userId);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  });
}
