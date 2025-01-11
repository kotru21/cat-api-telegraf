import sqlite3 from "sqlite3";

class Database {
  constructor() {
    this.db = new sqlite3.Database("./main.db", (err) => {
      if (err) {
        console.error("Ошибка подключения к SQLite:", err);
      } else {
        console.log("Подключено к SQLite");
        this.init();
      }
    });
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS msg (
          id TEXT PRIMARY KEY,
          count INTEGER DEFAULT 0,
          breed_name TEXT,
          image_url TEXT,
          description TEXT,
          wikipedia_url TEXT,
          breed_id TEXT,
          temperament TEXT,
          origin TEXT,
          life_span TEXT,
          weight_imperial TEXT,
          weight_metric TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
      console.log("База данных инициализирована");
    });
  }

  async saveCatDetails(catData) {
    // Проверяем наличие данных о породе
    if (!catData?.breeds?.[0]) {
      console.error("Нет данных о породе кота:", catData);
      return Promise.reject(new Error("Нет данных о породе кота"));
    }

    const breed = catData.breeds[0];

    return new Promise((resolve, reject) => {
      this.db.run(
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

  // Упрощенные методы без проверок
  async addLikes(catId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE msg SET count = count + 1 WHERE id = ?`,
        [catId],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  async getLikes(catId) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT count FROM msg WHERE id = ?`, [catId], (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
  }
  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
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
  async getCatById(catId) {
    return new Promise((resolve, reject) => {
      this.db.get(
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
}

export default new Database();
