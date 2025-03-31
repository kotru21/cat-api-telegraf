import { CatApiClient } from "../api/CatApiClient.js";
import catRepository from "../database/CatRepository.js";
import likesRepository from "../database/LikesRepository.js";
import config from "../config/index.js";

export class CatService {
  constructor() {
    this.catApiClient = new CatApiClient(config.CAT_API_TOKEN);
  }

  async getRandomCat(retryCount = 0) {
    try {
      const catDetails = await this.catApiClient.getRandomCatWithBreed();

      // Проверка наличия данных о породе
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

      await catRepository.saveCatDetails(catData);
      return catData;
    } catch (error) {
      console.error("Ошибка получения данных:", error);
      if (retryCount < 3) {
        return this.getRandomCat(retryCount + 1);
      }
      throw error;
    }
  }

  async getCatById(id) {
    return catRepository.getCatById(id);
  }

  async getLikesForCat(catId) {
    return likesRepository.getLikes(catId);
  }

  async addLikeToCat(catId, userId) {
    return likesRepository.addLike(catId, userId);
  }

  async removeLikeFromCat(catId, userId) {
    try {
      console.log(
        `CatService: removeLikeFromCat вызван с catId=${catId}, userId=${userId}`
      );
      // Проверим, что передаваемые параметры корректны
      if (!catId || !userId) {
        console.error(
          "CatService: removeLikeFromCat получил неверные параметры"
        );
        return false;
      }

      const result = await likesRepository.removeLike(catId, userId);
      console.log(`CatService: результат удаления лайка: ${result}`);
      return result;
    } catch (error) {
      console.error("CatService: ошибка при удалении лайка:", error);
      throw error;
    }
  }

  async getLeaderboard(limit = 10) {
    return catRepository.getLeaderboard(limit);
  }

  async getUserLikes(userId) {
    return likesRepository.getUserLikes(userId);
  }

  async getUserLikesCount(userId) {
    try {
      const userLikes = await likesRepository.getUserLikes(userId);
      return userLikes ? userLikes.length : 0;
    } catch (error) {
      console.error("Ошибка при получении статистики лайков:", error);
      return 0;
    }
  }

  async getCatsByFeature(feature, value) {
    if (!feature || !value) {
      throw new Error("Feature and value are required");
    }

    // проверка, что feature - допустимое поле
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

    return catRepository.getCatsByFeature(feature, value);
  }

  async getRandomImages(count = 3) {
    return catRepository.getRandomImages(count);
  }
}

export default new CatService();
