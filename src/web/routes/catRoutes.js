export function setupCatRoutes(
  router,
  { catService, requireAuth, leaderboardLimiter }
) {
  // Получение данных о коте по ID
  router.get("/cat/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const catData = await catService.getCatById(id);
      if (!catData) return res.status(404).json({ error: "Cat not found" });
      res.json(catData);
    } catch (err) {
      console.error("Error fetching cat:", err);
      res.status(500).json({ error: "Failed to fetch cat data" });
    }
  });

  // Получение лидерборда
  router.get("/leaderboard", leaderboardLimiter, async (req, res) => {
    try {
      const rows = await catService.getLeaderboard();
      res.json(rows);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Поиск котов по характеристикам
  router.get("/similar", async (req, res) => {
    try {
      const { feature, value } = req.query;

      if (!feature || !value) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const cats = await catService.getCatsByFeature(feature, value);
      res.json(cats);
    } catch (err) {
      console.error("Error fetching similar cats:", err);
      res.status(500).json({ error: "Failed to fetch similar cats" });
    }
  });

  // Получение случайных изображений
  router.get("/random-images", async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 3;
      const images = await catService.getRandomImages(count);
      res.json(images);
    } catch (err) {
      console.error("Error fetching random images:", err);
      res.status(500).json({ error: "Failed to fetch random images" });
    }
  });

  // Удаление лайка
  router.delete("/like", requireAuth, async (req, res) => {
    try {
      const { catId } = req.body;
      const userId = req.session.user.id.toString();

      if (!catId) {
        return res.status(400).json({ error: "ID кота не указан" });
      }

      console.log(`Попытка удалить лайк: catId=${catId}, userId=${userId}`);

      const result = await catService.removeLikeFromCat(catId, userId);

      if (result === false) {
        return res.status(404).json({ error: "Лайк не найден или уже удален" });
      }

      console.log("Лайк успешно удален");
      res.json({ success: true });
    } catch (err) {
      console.error("Ошибка удаления лайка:", err);
      res.status(500).json({ error: "Не удалось удалить лайк" });
    }
  });
}
