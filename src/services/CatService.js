import catInfoService from "./CatInfoService.js";
import likeService from "./LikeService.js";
import leaderboardService from "./LeaderboardService.js";

export class CatService {
  constructor() {
    this.catInfoService = catInfoService;
    this.likeService = likeService;
    this.leaderboardService = leaderboardService;
  }

  async getRandomCat(retryCount = 0) {
    return this.catInfoService.getRandomCat(retryCount);
  }

  async getCatById(id) {
    return this.catInfoService.getCatById(id);
  }

  async getLikesForCat(catId) {
    return this.likeService.getLikesForCat(catId);
  }

  async addLikeToCat(catId, userId) {
    return this.likeService.addLikeToCat(catId, userId);
  }

  async removeLikeFromCat(catId, userId) {
    return this.likeService.removeLikeFromCat(catId, userId);
  }

  async getLeaderboard(limit = 10) {
    return this.leaderboardService.getLeaderboard(limit);
  }

  async getUserLikes(userId) {
    return this.likeService.getUserLikes(userId);
  }

  async getUserLikesCount(userId) {
    return this.likeService.getUserLikesCount(userId);
  }

  async getCatsByFeature(feature, value) {
    return this.catInfoService.getCatsByFeature(feature, value);
  }

  async getRandomImages(count = 3) {
    return this.catInfoService.getRandomImages(count);
  }
}

export default new CatService();
