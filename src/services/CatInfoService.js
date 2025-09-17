export class CatInfoService {
  // Объектная инъекция зависимостей (awilix PROXY)
  constructor({ catApiClient, catRepository }) {
    this.catApiClient = catApiClient;
    this.repository = catRepository;
  }

  async getRandomCat(retryCount = 0) {
    try {
      const catDetails = await this.catApiClient.getRandomCatWithBreed();

      // Проверяем наличие данных о породе
      if (!catDetails?.breeds?.[0]) {
        throw new Error("Нет данных о породе кота");
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

  async getCatById(id) {
    return this.repository.getCatById(id);
  }

  async getCatsByFeature(feature, value) {
    if (!feature || !value) {
      throw new Error("Feature and value are required");
    }

    // Проверяем, что feature — допустимое поле
    const allowedFeatures = [
      "origin",
      "temperament",
      "life_span",
      "weight_imperial",
      "weight_metric",
    ];

    if (!allowedFeatures.includes(feature)) {
      throw new Error(`Invalid feature: ${feature}`);
    }

    return this.repository.getCatsByFeature(feature, value);
  }

  async getRandomImages(count = 3) {
    return this.repository.getRandomImages(count);
  }
}
