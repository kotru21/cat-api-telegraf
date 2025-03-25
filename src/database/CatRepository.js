import database from "./Database.js";

export class CatRepository {
  constructor() {
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
}

export default new CatRepository();
