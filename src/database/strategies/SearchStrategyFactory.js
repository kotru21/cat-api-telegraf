import { TemperamentSearchStrategy } from "./TemperamentSearchStrategy.js";
import { ExactMatchSearchStrategy } from "./ExactMatchSearchStrategy.js";
import { RangeSearchStrategy } from "./RangeSearchStrategy.js";

/**
 * Фабрика для создания стратегий поиска
 */
export class SearchStrategyFactory {
  /**
   * Создает подходящую стратегию поиска в зависимости от параметра
   * @param {string} feature - Название характеристики
   * @returns {SearchStrategy} - Стратегия поиска
   */
  static createStrategy(feature) {
    switch (feature) {
      case "temperament":
        return new TemperamentSearchStrategy();
      case "life_span":
      case "weight_metric":
      case "weight_imperial":
        return new RangeSearchStrategy();
      case "origin":
      default:
        return new ExactMatchSearchStrategy();
    }
  }
}
