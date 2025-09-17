import logger from "../utils/logger.js";

export class LikeService {
  // объектная инъекция через awilix PROXY
  constructor({ likesRepository }) {
    this.repository = likesRepository;
  }

  async getLikesForCat(catId) {
    return this.repository.getLikes(catId);
  }

  async addLikeToCat(catId, userId) {
    return this.repository.addLike(catId, userId);
  }

  async removeLikeFromCat(catId, userId) {
    try {
      logger.debug({ catId, userId }, "LikeService: removeLikeFromCat called");
      // Проверим, что передаваемые параметры корректны
      if (!catId || !userId) {
        logger.warn("LikeService: removeLikeFromCat received invalid params");
        return false;
      }

      const result = await this.repository.removeLike(catId, userId);
      logger.debug({ result }, "LikeService: unlike result");
      return result;
    } catch (error) {
      logger.error({ err: error }, "LikeService: error while removing like");
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
      logger.error({ err: error }, "Error getting likes count for user");
      return 0;
    }
  }
}
