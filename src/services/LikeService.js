import likesRepository from "../database/LikesRepository.js";

export class LikeService {
  constructor(repository = likesRepository) {
    this.repository = repository;
  }

  async getLikesForCat(catId) {
    return this.repository.getLikes(catId);
  }

  async addLikeToCat(catId, userId) {
    return this.repository.addLike(catId, userId);
  }

  async removeLikeFromCat(catId, userId) {
    try {
      console.log(
        `LikeService: removeLikeFromCat вызван с catId=${catId}, userId=${userId}`
      );
      // Проверим, что передаваемые параметры корректны
      if (!catId || !userId) {
        console.error(
          "LikeService: removeLikeFromCat получил неверные параметры"
        );
        return false;
      }

      const result = await this.repository.removeLike(catId, userId);
      console.log(`LikeService: результат удаления лайка: ${result}`);
      return result;
    } catch (error) {
      console.error("LikeService: ошибка при удалении лайка:", error);
      throw error;
    }
  }

  async getUserLikes(userId) {
    return this.repository.getUserLikes(userId);
  }

  async getUserLikesCount(userId) {
    try {
      const userLikes = await this.repository.getUserLikes(userId);
      return userLikes ? userLikes.length : 0;
    } catch (error) {
      console.error("Ошибка при получении статистики лайков:", error);
      return 0;
    }
  }
}

export default new LikeService();
