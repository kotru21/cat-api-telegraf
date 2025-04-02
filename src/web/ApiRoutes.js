import express from "express";
import rateLimit from "express-rate-limit";
import catService from "../services/CatService.js";

export function setupApiRoutes(app) {
  // Базовый лимитер для всех API-запросов
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // ограничение каждого IP до 100 запросов в окне
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Слишком много запросов, пожалуйста, попробуйте позже" },
  });

  // Более строгие ограничения для некоторых эндпоинтов
  const leaderboardLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 минут
    max: 30, // ограничение до 30 запросов в окне
    message: {
      error:
        "Слишком много запросов к лидерборду, пожалуйста, попробуйте позже",
    },
  });

  const router = express.Router();

  // Применяем базовый лимитер ко всем маршрутам API
  router.use(apiLimiter);

  // Middleware для проверки авторизации
  const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Существующие маршруты с дополнительными лимитами где необходимо
  router.get("/cat/:id", async (req, res) => {
    try {
      // Валидация параметра id для предотвращения SQL-инъекций
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

  router.get("/leaderboard", leaderboardLimiter, async (req, res) => {
    try {
      const rows = await catService.getLeaderboard();
      res.json(rows);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // маршрут для поиска котов по характеристикам (при клике на характеристику из catdetails)
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

  // API для получения профиля пользователя
  router.get("/profile", requireAuth, (req, res) => {
    // Возвращаем данные пользователя из сессии
    res.json(req.session.user);
  });

  // API для получения лайкнутых котов пользователя
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

  // Добавьте более подробную диагностическую информацию
  router.get("/debug-session", (req, res) => {
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      sessionUser: req.session.user,
      cookieSettings: req.session.cookie,
      headers: req.headers,
      secure: req.secure,
    });
  });

  router.post("/auth/telegram", (req, res) => {
    try {
      // Проверка данных от Telegram
      const { id, first_name, username, photo_url, auth_date, hash } = req.body;

      // Ваша существующая проверка подлинности данных...

      // Убедитесь, что пользователь корректно сохраняется в сессии
      req.session.user = {
        id,
        first_name,
        username,
        photo_url,
      };

      // Добавьте принудительное сохранение сессии
      req.session.save((err) => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.status(500).json({ error: "Session save failed" });
        }
        console.log("Пользователь успешно авторизован:", id, username);
        return res.json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // удаления лайка
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

  // API для получения количества лайков
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

  app.use("/api", router);
}
