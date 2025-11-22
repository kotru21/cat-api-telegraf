import { Cat } from '@prisma/client';

export interface CatRepositoryInterface {
  saveCatDetails(catData: Partial<Cat>): Promise<void>;
  getCatById(catId: string): Promise<Cat | null>;
  getLeaderboard(limit: number): Promise<Cat[]>;
  getCatsByFeature(feature: string, value: string | number): Promise<Cat[]>;
  getRandomImages(count: number): Promise<string[]>;
}
