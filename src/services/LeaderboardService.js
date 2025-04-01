import catRepository from "../database/CatRepository.js";

export class LeaderboardService {
  constructor(repository = catRepository) {
    this.repository = repository;
  }

  async getLeaderboard(limit = 10) {
    return this.repository.getLeaderboard(limit);
  }
}

export default new LeaderboardService();
