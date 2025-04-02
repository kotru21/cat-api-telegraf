export class UserController {
  constructor(catService) {
    this.catService = catService;
  }

  getProfile = (req, res) => {
    res.json(req.session.user);
  };

  getUserLikes = async (req, res) => {
    try {
      const userId = req.session.user.id.toString();
      const userLikes = await this.catService.getUserLikes(userId);
      res.json(userLikes);
    } catch (err) {
      console.error("Error fetching user likes:", err);
      res.status(500).json({ error: "Failed to fetch user likes" });
    }
  };

  removeLike = async (req, res) => {
    try {
      const { catId } = req.body;
      const userId = req.session.user.id.toString();

      if (!catId) {
        return res.status(400).json({ error: "ID кота не указан" });
      }

      console.log(`Попытка удалить лайк: catId=${catId}, userId=${userId}`);

      const result = await this.catService.removeLikeFromCat(catId, userId);

      if (result === false) {
        return res.status(404).json({ error: "Лайк не найден или уже удален" });
      }

      console.log("Лайк успешно удален");
      res.json({ success: true });
    } catch (err) {
      console.error("Ошибка удаления лайка:", err);
      res.status(500).json({ error: "Не удалось удалить лайк" });
    }
  };

  getLikesCount = async (req, res) => {
    try {
      const userId = req.session.user.id.toString();
      const count = await this.catService.getUserLikesCount(userId);
      res.json({ count });
    } catch (err) {
      console.error("Ошибка при получении количества лайков:", err);
      res.status(500).json({ error: "Не удалось получить количество лайков" });
    }
  };
}
