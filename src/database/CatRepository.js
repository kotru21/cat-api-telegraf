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
    const db = await this.dbPromise;

    // Подготовка поискового запроса в зависимости от типа характеристики
    let query = "";
    let params = [];

    if (feature === "temperament") {
      // Для темперамента ищется частичное совпадение
      query = `SELECT id, breed_name, image_url, description, wikipedia_url, count 
               FROM msg 
               WHERE temperament LIKE ? 
               ORDER BY count DESC`;
      params = [`%${value}%`];
    } else if (
      feature === "life_span" ||
      feature === "weight_metric" ||
      feature === "weight_imperial"
    ) {
      // Обрабатываем возраст и вес
      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        throw new Error(`Value for ${feature} must be a number`);
      }

      // получение всех записей с параметром для последующей фильтрации
      query = `SELECT id, breed_name, image_url, description, wikipedia_url, count, 
                     ${feature} as range_value
               FROM msg 
               ORDER BY count DESC`;
      params = [];

      console.log(
        `Выполняется запрос для поиска по ${feature} с ручной фильтрацией, значение: ${value}`
      );
    } else {
      // Для всех остальных полей -- точное совпадение
      query = `SELECT id, breed_name, image_url, description, wikipedia_url, count 
               FROM msg 
               WHERE ${feature} = ? 
               ORDER BY count DESC`;
      params = [value];
    }

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error(`Ошибка при поиске котов по ${feature}:`, err);
          reject(err);
        }

        // Фильтруем результаты программно для возраста и веса
        if (
          (feature === "life_span" ||
            feature === "weight_metric" ||
            feature === "weight_imperial") &&
          rows
        ) {
          const numValue = parseFloat(value);
          const filteredRows = rows.filter((row) => {
            try {
              if (!row.range_value) return false;

              // парсинг диапазона (например "12 - 15" или "3 - 6")
              const parts = row.range_value
                .split("-")
                .map((part) => parseFloat(part.trim()));

              // проверка, входит ли искомое значение в диапазон
              if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const min = parts[0];
                const max = parts[1];

                // допуск 5% для поиска
                return numValue >= min * 0.95 && numValue <= max * 1.05;
              }

              return false;
            } catch (e) {
              console.error(`Ошибка при обработке ${feature}:`, e);
              return false;
            }
          });

          console.log(
            `Найдено котов по ${feature}=${value} (после фильтрации):`,
            filteredRows.length
          );
          resolve(filteredRows);
        } else {
          console.log(
            `Найдено котов по ${feature}=${value}:`,
            rows?.length || 0
          );
          resolve(rows || []);
        }
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
