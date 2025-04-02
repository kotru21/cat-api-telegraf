import database from "./Database.js";

export class DatabaseService {
  constructor(db = database) {
    this.db = db;
  }

  async initialize() {
    await this.db.init();
    console.log("База данных инициализирована");
    return this.db;
  }

  async close() {
    await this.db.close();
    console.log("Соединение с базой данных закрыто");
  }
}
