import { CatRepository } from '../database/CatRepository.js';
import { LikesRepositoryInterface } from '../database/interfaces/LikesRepositoryInterface';
import { Cat } from '@prisma/client';

export class LeaderboardService {
  private repository: CatRepository;

  constructor({ catRepository }: { catRepository: CatRepository }) {
    this.repository = catRepository;
  }

  async getLeaderboard(limit = 10): Promise<Cat[]> {
    return this.repository.getLeaderboard(limit);
  }
}
