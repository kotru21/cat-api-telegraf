import { CatApiClient } from '../api/CatApiClient.js';
import { CatRepository } from '../database/CatRepository.js';
import { Cat } from '@prisma/client';
import { CatApiImage } from '../api/interfaces/TheCatApi.js';

export class CatInfoService {
  private catApiClient: CatApiClient;
  private repository: CatRepository;

  // Объектная инъекция зависимостей (awilix PROXY)
  constructor({
    catApiClient,
    catRepository,
  }: {
    catApiClient: CatApiClient;
    catRepository: CatRepository;
  }) {
    this.catApiClient = catApiClient;
    this.repository = catRepository;
  }

  async getRandomCat(retryCount = 0): Promise<CatApiImage> {
    try {
      const catDetails = await this.catApiClient.getRandomCatWithBreed();

      // Проверяем наличие данных о породе
      if (!catDetails?.breeds?.[0]) {
        throw new Error('Нет данных о породе кота');
      }

      const breed = catDetails.breeds[0];

      const catData = {
        id: catDetails.id,
        url: catDetails.url,
        breeds: [
          {
            id: breed.id,
            name: breed.name,
            temperament: breed.temperament,
            origin: breed.origin,
            life_span: breed.life_span,
            wikipedia_url: breed.wikipedia_url,
            weight: breed.weight,
            description: breed.description,
          },
        ],
      };

      await this.repository.saveCatDetails(catData);
      return catData;
    } catch (error) {
      if (retryCount < 3) {
        return this.getRandomCat(retryCount + 1);
      }
      throw error;
    }
  }

  async getCatById(id: string): Promise<Cat | null> {
    return this.repository.getCatById(id);
  }

  async getCatsByFeature(feature: string, value: string | number): Promise<Cat[]> {
    if (!feature || !value) {
      throw new Error('Feature and value are required');
    }

    // Проверяем, что feature — допустимое поле
    const allowedFeatures = [
      'origin',
      'temperament',
      'life_span',
      'weight_imperial',
      'weight_metric',
    ];

    if (!allowedFeatures.includes(feature)) {
      throw new Error(`Invalid feature: ${feature}`);
    }

    return this.repository.getCatsByFeature(feature, value);
  }

  async getRandomImages(count = 3): Promise<{ id: string; url: string }[]> {
    return this.repository.getRandomImages(count);
  }
}
