import sqlite3 from "sqlite3";

export class Database {
  constructor(dbPath = "./main.db") {
    this.dbPath = dbPath;
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Ошибка подключения к SQLite:", err);
          reject(err);
        } else {
          console.log("Подключено к SQLite");
          resolve(this.db);
        }
      });
    });
  }

  async init() {
    if (this.initialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      if (!this.db) {
        await this.connect();
      }

      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          this.db.run(
            `
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
            )`,
            (err) => {
              if (err) {
                console.error("Ошибка инициализации БД:", err);
                reject(err);
                return;
              }
            }
          );

          // таблица для хранения информации о лайках пользователей
          this.db.run(
            `
            CREATE TABLE IF NOT EXISTS user_likes (
              user_id TEXT,
              cat_id TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (user_id, cat_id)
            )`,
            (err) => {
              if (err) {
                console.error("Ошибка создания таблицы user_likes:", err);
                reject(err);
                return;
              }

              console.log("База данных инициализирована");
              this.initialized = true;
              resolve();
            }
          );
        });
      });
    })();

    return this.initPromise;
  }

  async get() {
    if (!this.initialized) {
      await this.init();
    }
    return this.db;
  }

  close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error("Ошибка при закрытии БД:", err);
          else console.log("Соединение с БД закрыто");
          this.initialized = false;
          this.db = null;
          resolve();
        });
      });
    }
  }
}

// Singleton для доступа к БД
const database = new Database();
export default database;
