export class CatRepositoryInterface {
  /**
   * Сохраняет данные о коте
   * @param {Object} catData - Данные кота
   * @returns {Promise<void>}
   */
  async saveCatDetails(catData) {
    throw new Error("Method not implemented");
  }

  /**
   * Получает информацию о коте по идентификатору
   * @param {string} catId - Идентификатор кота
   * @returns {Promise<Object>} - Данные о коте
   */
  async getCatById(catId) {
    throw new Error("Method not implemented");
  }

  /**
   * Получает топ-N котов по количеству лайков
   * @param {number} limit - Максимальное количество записей
   * @returns {Promise<Array>} - Список котов
   */
  async getLeaderboard(limit) {
    throw new Error("Method not implemented");
  }

  /**
   * Поиск котов по определенному свойству
   * @param {string} feature - Название свойства
   * @param {string|number} value - Значение свойства
   * @returns {Promise<Array>} - Список котов
   */
  async getCatsByFeature(feature, value) {
    throw new Error("Method not implemented");
  }

  /**
   * Получает случайные изображения котов
   * @param {number} count - Количество изображений
   * @returns {Promise<Array>} - Список изображений
   */
  async getRandomImages(count) {
    throw new Error("Method not implemented");
  }
}
