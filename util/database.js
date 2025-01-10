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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
      console.log("База данных инициализирована");
    });
  }

  async saveCatDetails(catData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO msg (
          id, breed_name, image_url, description, wikipedia_url, count
        ) VALUES (?, ?, ?, ?, ?, COALESCE((SELECT count FROM msg WHERE id = ?), 0))`,
        [
          catData.id,
          catData.breed_name,
          catData.image_url,
          catData.description,
          catData.wikipedia_url,
          catData.id,
        ],
        (err) => {
          if (err) {
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
        `SELECT id, breed_name, image_url, description, wikipedia_url, count
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
