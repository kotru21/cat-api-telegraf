export class LikesRepositoryInterface {
  /**
   * Получает количество лайков для кота
   * @param {string} catId - Идентификатор кота
   * @returns {Promise<number>} - Количество лайков
   */
  async getLikes(catId) {
    throw new Error("Method not implemented");
  }

  /**
   * Добавляет лайк коту от пользователя
   * @param {string} catId - Идентификатор кота
   * @param {string|number} userId - Идентификатор пользователя
   * @returns {Promise<boolean>} - Успешность операции
   */
  async addLike(catId, userId) {
    throw new Error("Method not implemented");
  }

  /**
   * Удаляет лайк кота от пользователя
   * @param {string} catId - Идентификатор кота
   * @param {string|number} userId - Идентификатор пользователя
   * @returns {Promise<boolean>} - Успешность операции
   */
  async removeLike(catId, userId) {
    throw new Error("Method not implemented");
  }

  /**
   * Получает список лайков пользователя
   * @param {string|number} userId - Идентификатор пользователя
   * @returns {Promise<Array>} - Список лайкнутых котов
   */
  async getUserLikes(userId) {
    throw new Error("Method not implemented");
  }
}
