import logger from "../utils/logger.js";
import { LikesRepository } from "../database/LikesRepository.js";
import { UserLikeDTO } from "../database/interfaces/LikesRepositoryInterface.js";

export class LikeService {
  private repository: LikesRepository;

  // объектная инъекция через awilix PROXY
  constructor({ likesRepository }: { likesRepository: LikesRepository }) {
    this.repository = likesRepository;
  }

  async getLikesForCat(catId: string): Promise<number> {
    return this.repository.getLikes(catId);
  }

  async addLikeToCat(catId: string, userId: string): Promise<boolean> {
    return this.repository.addLike(catId, userId);
  }

  async removeLikeFromCat(catId: string, userId: string): Promise<boolean> {
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

  async getUserLikes(userId: string): Promise<UserLikeDTO[]> {
    return this.repository.getUserLikes(userId);
  }

  async getUserLikesCount(userId: string): Promise<number> {
    try {
      const userLikes = await this.repository.getUserLikes(userId);
      return userLikes ? userLikes.length : 0;
    } catch (error) {
      logger.error({ err: error }, "Error getting likes count for user");
      return 0;
    }
  }
}
