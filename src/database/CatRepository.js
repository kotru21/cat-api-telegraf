import { CatRepositoryInterface } from "./interfaces/CatRepositoryInterface.js";
import logger from "../utils/logger.js";
import getPrisma from "./prisma/PrismaClient.js";

export class CatRepository extends CatRepositoryInterface {
  constructor({ prisma = getPrisma() } = {}) {
    super();
    this.prisma = prisma;
  }

  async saveCatDetails(catData) {
    if (!catData?.breeds?.[0]) {
      throw new Error("No breed data provided for the cat");
    }

    const breed = catData.breeds[0];

    try {
      await this.prisma.msg.upsert({
        where: { id: catData.id },
        create: {
          id: catData.id,
          breed_name: breed.name,
          image_url: catData.url,
          description: breed.description,
          wikipedia_url: breed.wikipedia_url,
          breed_id: breed.id,
          temperament: breed.temperament,
          origin: breed.origin,
          life_span: breed.life_span,
          weight_imperial: breed.weight?.imperial,
          weight_metric: breed.weight?.metric,
          count: 0,
        },
        update: {
          // Обновляет метаданные, count не трогает, чтобы сохранить существующие лайки
          breed_name: breed.name,
          image_url: catData.url,
          description: breed.description,
          wikipedia_url: breed.wikipedia_url,
          breed_id: breed.id,
          temperament: breed.temperament,
          origin: breed.origin,
          life_span: breed.life_span,
          weight_imperial: breed.weight?.imperial,
          weight_metric: breed.weight?.metric,
        },
      });
    } catch (err) {
      logger.error({ err }, "Error saving cat data (Prisma)");
      throw err;
    }
  }

  async getCatById(catId) {
    if (
      !catId ||
      typeof catId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(catId)
    ) {
      throw new Error("Invalid cat ID format");
    }
    try {
      return await this.prisma.msg.findUnique({
        where: { id: catId },
        select: {
          id: true,
          breed_name: true,
          image_url: true,
          description: true,
          wikipedia_url: true,
          count: true,
          temperament: true,
          origin: true,
          life_span: true,
          weight_imperial: true,
          weight_metric: true,
        },
      });
    } catch (err) {
      logger.error({ err }, "Error fetching cat by id (Prisma)");
      throw err;
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      return await this.prisma.msg.findMany({
        where: { count: { gt: 0 } },
        orderBy: { count: "desc" },
        take: limit,
        select: { id: true, count: true, breed_name: true, image_url: true },
      });
    } catch (err) {
      logger.error({ err }, "Error fetching leaderboard (Prisma)");
      throw err;
    }
  }

  async getCatsByFeature(feature, value) {
    if (!feature || !value) {
      throw new Error("Feature and value are required");
    }

    try {
      // Попытка фильтрации на уровне БД для популярных полей
      const where = (() => {
        const v = String(value);
        if (feature === "origin") {
          // точное совпадение по origin
          return { origin: v };
        }
        if (feature === "temperament") {
          // строка темперамента может содержать список через запятую — ищем подстроку
          return { temperament: { contains: v } };
        }
        return null;
      })();

      if (where) {
        const rows = await this.prisma.msg.findMany({
          where,
          select: {
            id: true,
            breed_name: true,
            image_url: true,
            description: true,
            wikipedia_url: true,
            count: true,
            temperament: true,
            origin: true,
            life_span: true,
            weight_imperial: true,
            weight_metric: true,
          },
        });
        logger.debug(
          { feature, value, count: rows?.length || 0 },
          "Cats found by feature (DB filter)"
        );
        return rows || [];
      }

      // Диапазонные поля: фильтрует ORM + JS-стратегия
      const rangeFeatures = new Set([
        "life_span",
        "weight_imperial",
        "weight_metric",
      ]);
      if (rangeFeatures.has(feature)) {
        const whereAnd = [
          { [feature]: { not: null } },
          { [feature]: { not: "" } },
          { [feature]: { contains: "-" } },
        ];

        const rows = await this.prisma.msg.findMany({
          where: { AND: whereAnd },
          select: {
            id: true,
            breed_name: true,
            image_url: true,
            description: true,
            wikipedia_url: true,
            count: true,
            temperament: true,
            origin: true,
            life_span: true,
            weight_imperial: true,
            weight_metric: true,
          },
          orderBy: { count: "desc" },
        });

        const filtered = this.filterRangeResults(rows, feature, value);
        logger.debug(
          { feature, value, count: filtered?.length || 0 },
          "Cats found by feature (ORM + JS range)"
        );
        return filtered || [];
      }
      // Остальные поля: не используются, но оставляем для совместимости
      logger.debug({ feature, value }, "Feature not supported for filtering");
      return [];
    } catch (err) {
      logger.error({ err, feature, value }, "Error searching cats by feature");
      throw err;
    }
  }

  /**
   * Фильтрует результаты по диапазонным значениям (life_span, weight_*)
   * @param {Array} rows - результаты из БД
   * @param {string} feature - название поля
   * @param {string|number} value - искомое значение
   * @returns {Array} отфильтрованные результаты
   */
  filterRangeResults(rows, feature, value) {
    if (!rows) return [];

    const numValue = parseFloat(String(value).replace(",", "."));
    if (isNaN(numValue)) return [];

    return rows.filter((row) => {
      try {
        const rangeStr = (row[feature] ?? "").toString();
        if (!rangeStr) return false;

        // Парсинг диапазона (например "12 - 15" или "3 - 6")
        const cleaned = rangeStr.replace(/[–—−]/g, "-"); // заменяем длинные тире на обычное
        const match = cleaned.match(
          /^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/
        );

        if (!match) return false;

        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);

        if (isNaN(min) || isNaN(max)) return false;

        return numValue >= min && numValue <= max;
      } catch (error) {
        logger.debug(
          { err: error, row, feature, value },
          "Range parsing error"
        );
        return false;
      }
    });
  }

  async getRandomImages(count = 3) {
    try {
      // Используем Prisma для случайной выборки
      // Для SQLite используем orderBy: { id: "asc" } с skip случайного количества записей
      // Это более эффективно чем RANDOM() для больших таблиц
      const totalCount = await this.prisma.msg.count({
        where: { image_url: { not: null } },
      });

      if (totalCount === 0) {
        return [];
      }

      const randomOffset = Math.floor(
        Math.random() * Math.max(1, totalCount - count)
      );

      const rows = await this.prisma.msg.findMany({
        where: {
          image_url: { not: null },
          image_url: { not: "" },
        },
        select: { image_url: true },
        skip: randomOffset,
        take: count,
      });

      return rows || [];
    } catch (err) {
      logger.error({ err }, "Error fetching random images (Prisma)");
      throw err;
    }
  }
}
