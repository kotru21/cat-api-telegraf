import sqlite3 from "sqlite3";

class Database {
  constructor() {
    this.db = new sqlite3.Database("./main.db", (err) => {
      if (err) {
        console.error("Ошибка подключения к SQLite:", err);
      } else {
        console.log("Подключено к SQLite.");
        this.init();
      }
    });
  }

  init() {
    this.db.serialize(() => {
      this.db.run(
        "CREATE TABLE IF NOT EXISTS msg (id TEXT PRIMARY KEY, name TEXT, count INTEGER)"
      );
    });
  }

  async addLikes(catId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE msg SET count = count + 1 WHERE id = ?`,
        [catId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getLikes(catId) {
    await this.ensureCatExists(catId);
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT count FROM msg WHERE id = ?`,
        [catId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async ensureCatExists(catId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR IGNORE INTO msg (id, count) VALUES (?, 0)`,
        [catId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, count FROM msg ORDER BY count DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

export default new Database();
