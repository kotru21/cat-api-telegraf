import { SearchStrategy } from "./SearchStrategy.js";

export class RangeSearchStrategy extends SearchStrategy {
  createQuery(feature, value) {
    return {
      query: `SELECT id, breed_name, image_url, description, wikipedia_url, count, 
                     ${feature} as range_value
              FROM msg 
              ORDER BY count DESC`,
      params: [],
    };
  }

  filterResults(rows, feature, value) {
    if (!rows) return [];

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return [];

    return rows.filter((row) => {
      try {
        if (!row.range_value) return false;

        // Парсинг диапазона (например "12 - 15" или "3 - 6")
        const parts = row.range_value
          .split("-")
          .map((part) => parseFloat(part.trim()));

        // Проверка, входит ли искомое значение в диапазон
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const min = parts[0];
          const max = parts[1];

          // Допуск 5% для поиска
          return numValue >= min * 0.95 && numValue <= max * 1.05;
        }

        return false;
      } catch (e) {
        console.error(`Ошибка при обработке ${feature}:`, e);
        return false;
      }
    });
  }
}
