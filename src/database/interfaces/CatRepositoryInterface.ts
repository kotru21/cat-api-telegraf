import { Cat } from '@prisma/client';
import { CatApiImage } from '../../api/interfaces/TheCatApi.js';

export interface CatRepositoryInterface {
  /**
   * Save cat details from TheCatApi response
   * @param catData - Raw response from TheCatApi with breed information
   */
  saveCatDetails(catData: CatApiImage): Promise<void>;
  getCatById(catId: string): Promise<Cat | null>;
  getLeaderboard(limit: number): Promise<Cat[]>;
  getCatsByFeature(feature: string, value: string | number): Promise<Cat[]>;
  getRandomImages(count: number): Promise<string[]>;
}
