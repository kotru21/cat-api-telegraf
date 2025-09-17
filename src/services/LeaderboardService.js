export class LeaderboardService {
  constructor({ catRepository }) {
    this.repository = catRepository;
  }

  async getLeaderboard(limit = 10) {
    return this.repository.getLeaderboard(limit);
  }
}
