import database from "./Database.js";
import { CatRepositoryInterface } from "./interfaces/CatRepositoryInterface.js";
import { SearchStrategyFactory } from "./strategies/SearchStrategyFactory.js";

export class CatRepository extends CatRepositoryInterface {
  constructor() {
    super();
    this.dbPromise = database.get();
  }

  async saveCatDetails(catData) {
    if (!catData?.breeds?.[0]) {
      throw new Error("Нет данных о породе кота");
    }

    const breed = catData.breeds[0];
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO msg (
          id, breed_name, image_url, description, wikipedia_url, count,
          breed_id, temperament, origin, life_span, 
          weight_imperial, weight_metric
        ) VALUES (?, ?, ?, ?, ?, COALESCE((SELECT count FROM msg WHERE id = ?), 0),
          ?, ?, ?, ?, ?, ?)`,

        [
          catData.id,
          breed.name,
          catData.url,
          breed.description,
          breed.wikipedia_url,
          catData.id,
          breed.id,
          breed.temperament,
          breed.origin,
          breed.life_span,
          breed.weight?.imperial,
          breed.weight?.metric,
        ],
        (err) => {
          if (err) {
            console.error("Ошибка сохранения данных:", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getCatById(catId) {
    // Валидация входного параметра
    if (
      !catId ||
      typeof catId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(catId)
    ) {
      throw new Error("Invalid cat ID format");
    }

    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, breed_name, image_url, description, wikipedia_url, count,
                temperament, origin, life_span, weight_imperial, weight_metric
         FROM msg 
         WHERE id = ?`,
        [catId],
        (err, row) => {
          if (err) {
            console.error("Ошибка при получении данных кота:", err);
            reject(err);
          }
          resolve(row);
        }
      );
    });
  }

  async getLeaderboard(limit = 10) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, count, breed_name, image_url
         FROM msg 
         WHERE count > 0
         ORDER BY count DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) {
            console.error("Ошибка при получении таблицы лидеров:", err);
            reject(err);
          }
          resolve(rows);
        }
      );
    });
  }

  async getCatsByFeature(feature, value) {
    if (!feature || !value) {
      throw new Error("Feature and value are required");
    }

    const db = await this.dbPromise;

    // Используем фабрику для получения нужной стратегии
    const searchStrategy = SearchStrategyFactory.createStrategy(feature);

    // Получаем SQL-запрос от стратегии
    const { query, params } = searchStrategy.createQuery(feature, value);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error(`Ошибка при поиске котов по ${feature}:`, err);
          reject(err);
        }

        // Применяем дополнительную фильтрацию, если это необходимо
        const filteredRows = searchStrategy.filterResults(rows, feature, value);

        console.log(
          `Найдено котов по ${feature}=${value}:`,
          filteredRows?.length || 0
        );

        resolve(filteredRows || []);
      });
    });
  }

  async getRandomImages(count = 3) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT image_url FROM msg 
         WHERE image_url IS NOT NULL 
         ORDER BY RANDOM() 
         LIMIT ?`,
        [count],
        (err, rows) => {
          if (err) {
            console.error("Ошибка при получении случайных изображений:", err);
            reject(err);
          }
          resolve(rows || []);
        }
      );
    });
  }
}

export default new CatRepository();
