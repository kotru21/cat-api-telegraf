export function setupUserRoutes(router, { catService, requireAuth }) {
  // Получение профиля пользователя
  router.get("/profile", requireAuth, (req, res) => {
    res.json(req.session.user);
  });

  // Получение лайкнутых котов пользователя
  router.get("/mylikes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user.id.toString();
      const userLikes = await catService.getUserLikes(userId);
      res.json(userLikes);
    } catch (err) {
      console.error("Error fetching user likes:", err);
      res.status(500).json({ error: "Failed to fetch user likes" });
    }
  });

  // Получение количества лайков
  router.get("/user/likes/count", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user.id.toString();
      const count = await catService.getUserLikesCount(userId);
      res.json({ count });
    } catch (err) {
      console.error("Ошибка при получении количества лайков:", err);
      res.status(500).json({ error: "Не удалось получить количество лайков" });
    }
  });
}
