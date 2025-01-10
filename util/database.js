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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
      console.log("База данных инициализирована");
    });
  }

  async addLikes(catId) {
    try {
      await this.ensureCatExists(catId);
      return new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE msg 
           SET count = count + 1
           WHERE id = ?`,
          [catId],
          (err) => {
            if (err) {
              console.error("Ошибка при добавлении лайка:", err);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error("Ошибка при добавлении лайка:", error);
      throw error;
    }
  }

  async ensureCatExists(catId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR IGNORE INTO msg (id, count) 
         VALUES (?, 1)`,
        [catId],
        (err) => {
          if (err) {
            console.error("Ошибка при создании записи:", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getLikes(catId) {
    try {
      await this.ensureCatExists(catId);
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT count FROM msg WHERE id = ?`,
          [catId],
          (err, rows) => {
            if (err) {
              console.error("Ошибка при получении лайков:", err);
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });
    } catch (error) {
      console.error("Ошибка при получении лайков:", error);
      throw error;
    }
  }

  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, count, breed_name 
         FROM msg 
         WHERE count > 0
         ORDER BY count DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) {
            console.error("Ошибка при получении таблицы лидеров:", err);
            reject(err);
          } else {
            const rowsWithUrls = rows.map((row) => ({
              ...row,
              image_url: this.generateImageUrl(row.id),
            }));
            resolve(rowsWithUrls);
          }
        }
      );
    });
  }

  async getCatInfo(catId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id, count, breed_name, created_at 
         FROM msg 
         WHERE id = ?`,
        [catId],
        (err, row) => {
          if (err) {
            console.error("Ошибка при получении информации о коте:", err);
            reject(err);
          } else {
            if (row) {
              row.image_url = this.generateImageUrl(row.id);
            }
            resolve(row);
          }
        }
      );
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error("Ошибка при закрытии базы данных:", err);
          reject(err);
        } else {
          console.log("База данных успешно закрыта");
          resolve();
        }
      });
    });
  }
}

export default new Database();
