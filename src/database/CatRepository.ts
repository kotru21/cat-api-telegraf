import { CatRepositoryInterface } from './interfaces/CatRepositoryInterface.js';
import logger from '../utils/logger.js';
import getPrisma from './prisma/PrismaClient.js';
import { PrismaClient, Cat } from '@prisma/client';
import { CatApiImage } from '../api/interfaces/TheCatApi.js';

export class CatRepository implements CatRepositoryInterface {
  private prisma: PrismaClient;

  constructor({ prisma = getPrisma() } = {}) {
    this.prisma = prisma;
  }

  async saveCatDetails(catData: CatApiImage): Promise<void> {
    if (!catData?.breeds?.[0]) {
      throw new Error('No breed data provided for the cat');
    }

    const breed = catData.breeds[0];

    try {
      await this.prisma.cat.upsert({
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
      logger.error({ err }, 'Error saving cat data (Prisma)');
      throw err;
    }
  }

  async getCatById(catId: string): Promise<Cat | null> {
    if (!catId || typeof catId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(catId)) {
      throw new Error('Invalid cat ID format');
    }
    try {
      return await this.prisma.cat.findUnique({
        where: { id: catId },
      });
    } catch (err) {
      logger.error({ err }, 'Error fetching cat by id (Prisma)');
      throw err;
    }
  }

  async getLeaderboard(limit = 10): Promise<Cat[]> {
    try {
      return await this.prisma.cat.findMany({
        where: { count: { gt: 0 } },
        orderBy: { count: 'desc' },
        take: limit,
      });
    } catch (err) {
      logger.error({ err }, 'Error fetching leaderboard (Prisma)');
      throw err;
    }
  }

  async getCatsByFeature(feature: string, value: string | number): Promise<Cat[]> {
    if (!feature || !value) {
      throw new Error('Feature and value are required');
    }

    try {
      // Попытка фильтрации на уровне БД для популярных полей
      const where = (() => {
        const v = String(value);
        if (feature === 'origin') {
          // точное совпадение по origin
          return { origin: v };
        }
        if (feature === 'temperament') {
          // строка темперамента может содержать список через запятую — ищем подстроку
          return { temperament: { contains: v } };
        }
        return null;
      })();

      if (where) {
        const rows = await this.prisma.cat.findMany({
          where,
        });
        logger.debug(
          { feature, value, count: rows?.length || 0 },
          'Cats found by feature (DB filter)',
        );
        return rows || [];
      }

      // Диапазонные поля: фильтрует ORM + JS-стратегия
      const rangeFeatures = new Set(['life_span', 'weight_imperial', 'weight_metric']);
      if (rangeFeatures.has(feature)) {
        const whereAnd = [
          { [feature]: { not: null } },
          { [feature]: { not: '' } },
          { [feature]: { contains: '-' } },
        ];

        const rows = await this.prisma.cat.findMany({
          where: { AND: whereAnd },
          orderBy: { count: 'desc' },
        });

        const filtered = this.filterRangeResults(rows, feature, value);
        logger.debug(
          { feature, value, count: filtered?.length || 0 },
          'Cats found by feature (ORM + JS range)',
        );
        return filtered || [];
      }
      // Остальные поля: не используются, но оставляем для совместимости
      logger.debug({ feature, value }, 'Feature not supported for filtering');
      return [];
    } catch (err) {
      logger.error({ err, feature, value }, 'Error searching cats by feature');
      throw err;
    }
  }

  /**
   * Фильтрует результаты по диапазонным значениям (life_span, weight_*)
   */
  private filterRangeResults(rows: Cat[], feature: string, value: string | number): Cat[] {
    if (!rows) return [];

    const numValue = parseFloat(String(value).replace(',', '.'));
    if (isNaN(numValue)) return [];

    return rows.filter((row) => {
      try {
        const rangeStr = (row[feature as keyof Cat] ?? '').toString();
        if (!rangeStr) return false;

        // Парсинг диапазона (например "12 - 15" или "3 - 6")
        const cleaned = rangeStr.replace(/[–—−]/g, '-'); // заменяем длинные тире на обычное
        const match = cleaned.match(/^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/);

        if (!match) return false;

        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);

        if (isNaN(min) || isNaN(max)) return false;

        return numValue >= min && numValue <= max;
      } catch (error) {
        logger.debug({ err: error, row, feature, value }, 'Range parsing error');
        return false;
      }
    });
  }

  async getRandomImages(count = 3): Promise<string[]> {
    try {
      // Используем Prisma для случайной выборки
      // Для SQLite используем orderBy: { id: "asc" } с skip случайного количества записей
      // Это более эффективно чем RANDOM() для больших таблиц
      const totalCount = await this.prisma.cat.count({
        where: { image_url: { not: null } },
      });

      if (totalCount === 0) {
        return [];
      }

      const randomOffset = Math.floor(Math.random() * Math.max(1, totalCount - count));

      const rows = await this.prisma.cat.findMany({
        where: {
          AND: [{ image_url: { not: null } }, { image_url: { not: '' } }],
        },
        select: { image_url: true },
        skip: randomOffset,
        take: count,
      });

      return rows.map((r) => r.image_url).filter((url): url is string => url !== null);
    } catch (err) {
      logger.error({ err }, 'Error fetching random images (Prisma)');
      throw err;
    }
  }
}
