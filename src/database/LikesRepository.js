import database from "./Database.js";

// Добавим систему событий для оповещения об изменениях
import { EventEmitter } from "events";

export const likesEvents = new EventEmitter();

export class LikesRepository {
  constructor() {
    this.dbPromise = database.get();
  }

  // Проверка, ставил ли пользователь лайк данному коту
  async hasUserLiked(userId, catId) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM user_likes WHERE user_id = ? AND cat_id = ?`,
        [userId, catId],
        (err, row) => {
          if (err) {
            console.error("Ошибка при проверке лайка:", err);
            reject(err);
          } else {
            resolve(!!row); // true если запись найдена, false если нет
          }
        }
      );
    });
  }

  // Добавление записи о лайке пользователя и увеличение счетчика
  async addLike(catId, userId) {
    const db = await this.dbPromise;

    // Проверяем, ставил ли уже пользователь лайк
    const hasLiked = await this.hasUserLiked(userId, catId);
    if (hasLiked) {
      return false; // Лайк уже поставлен
    }

    return new Promise((resolve, reject) => {
      // Начинаем транзакцию для гарантии целостности данных
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Добавляем запись о лайке пользователя
        db.run(
          `INSERT INTO user_likes (user_id, cat_id) VALUES (?, ?)`,

          [userId, catId],
          (err) => {
            if (err) {
              db.run("ROLLBACK");
              console.error("Ошибка добавления лайка пользователя:", err);
              reject(err);
              return;
            }

            // Увеличиваем счетчик лайков для кота
            db.run(
              `UPDATE msg SET count = count + 1 WHERE id = ?`,
              [catId],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  console.error("Ошибка обновления счетчика лайков:", err);
                  reject(err);
                  return;
                }

                db.run("COMMIT");

                // Генерируем событие обновления рейтинга
                likesEvents.emit("leaderboardChanged");

                resolve(true); // Лайк успешно добавлен
              }
            );
          }
        );
      });
    });
  }

  // Удаление лайка
  async removeLike(catId, userId) {
    const db = await this.dbPromise;

    console.log(
      `LikesRepository: removeLike вызван с catId=${catId}, userId=${userId}`
    );

    // Проверяем, ставил ли пользователь лайк
    const hasLiked = await this.hasUserLiked(userId, catId);
    console.log(
      `LikesRepository: пользователь ${userId} ставил лайк коту ${catId}: ${hasLiked}`
    );

    if (!hasLiked) {
      console.log("LikesRepository: лайк не найден, возвращаем false");
      return false; // Лайк не был поставлен
    }

    return new Promise((resolve, reject) => {
      // Начинаем транзакцию для гарантии целостности данных
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Удаляем запись о лайке пользователя
        db.run(
          `DELETE FROM user_likes WHERE user_id = ? AND cat_id = ?`,
          [userId, catId],
          (err) => {
            if (err) {
              db.run("ROLLBACK");
              console.error("Ошибка удаления лайка пользователя:", err);
              reject(err);
              return;
            }

            // Уменьшаем счетчик лайков для кота
            db.run(
              `UPDATE msg SET count = count - 1 WHERE id = ? AND count > 0`,
              [catId],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  console.error("Ошибка обновления счетчика лайков:", err);
                  reject(err);
                  return;
                }

                db.run("COMMIT");
                console.log(
                  `LikesRepository: лайк успешно удален для кота ${catId}`
                );

                // Генерируем событие обновления рейтинга
                likesEvents.emit("leaderboardChanged");

                resolve(true); // Лайк успешно удален
              }
            );
          }
        );
      });
    });
  }

  async getLikes(catId) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      db.all(`SELECT count FROM msg WHERE id = ?`, [catId], (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
  }

  async getUserLikes(userId) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ul.cat_id, m.breed_name, m.id, m.image_url, m.count as likes_count
         FROM user_likes ul
         JOIN msg m ON ul.cat_id = m.id
         WHERE ul.user_id = ?
         ORDER BY ul.created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            console.error("Ошибка при получении лайков пользователя:", err);
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }
}

export default new LikesRepository();
