import { LikesRepositoryInterface } from "./interfaces/LikesRepositoryInterface.js";
import logger from "../utils/logger.js";
import getPrisma from "./prisma/PrismaClient.js";
import AppEvents, { EVENTS } from "../application/events.js";

export class LikesRepository extends LikesRepositoryInterface {
  constructor({ prisma = getPrisma() } = {}) {
    super();
    this.prisma = prisma;
  }

  async hasUserLiked(userId, catId) {
    try {
      const liked = await this.prisma.user_likes.findFirst({
        where: { user_id: userId, cat_id: catId },
        select: { user_id: true },
      });
      return !!liked;
    } catch (err) {
      logger.error({ err }, "Error checking like existence (Prisma)");
      throw err;
    }
  }

  async addLike(catId, userId) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Пытаемся вставить лайк; составной PK не даст дубликат
        await tx.user_likes.create({
          data: { user_id: userId, cat_id: catId },
        });

        // Увеличиваем счётчик у кота; если записи нет, ничего не делаем
        await tx.msg.updateMany({
          where: { id: catId },
          data: { count: { increment: 1 } },
        });

        return true;
      });

      // Уведомим подписчиков о смене лидерборда
      AppEvents.emit(EVENTS.LEADERBOARD_CHANGED);
      return result;
    } catch (err) {
      // Уникальный дубликат (лайк уже есть)
      if (err && err.code === "P2002") {
        return false;
      }
      logger.error({ err }, "Failed to add like (Prisma)");
      throw err;
    }
  }

  async removeLike(catId, userId) {
    logger.debug(
      { catId, userId },
      "LikesRepository (Prisma): removeLike called"
    );
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const deleted = await tx.user_likes.deleteMany({
          where: { user_id: userId, cat_id: catId },
        });

        if (deleted.count === 0) {
          return false;
        }

        await tx.msg.updateMany({
          where: { id: catId, count: { gt: 0 } },
          data: { count: { decrement: 1 } },
        });
        return true;
      });

      if (result) {
        AppEvents.emit(EVENTS.LEADERBOARD_CHANGED);
      }
      return result;
    } catch (err) {
      logger.error({ err }, "Failed to remove like (Prisma)");
      throw err;
    }
  }

  async getLikes(catId) {
    try {
      const row = await this.prisma.msg.findUnique({
        where: { id: catId },
        select: { count: true },
      });
      return row ? [{ count: row.count || 0 }] : [];
    } catch (err) {
      logger.error({ err }, "Error fetching likes for cat (Prisma)");
      throw err;
    }
  }

  async getUserLikes(userId) {
    try {
      const rows = await this.prisma.user_likes.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        include: {
          cat: {
            select: {
              id: true,
              breed_name: true,
              image_url: true,
              count: true,
            },
          },
        },
      });
      // Приводим к прежней форме данных
      return rows.map((r) => ({
        cat_id: r.cat_id,
        id: r.cat?.id,
        breed_name: r.cat?.breed_name,
        image_url: r.cat?.image_url,
        likes_count: r.cat?.count ?? 0,
      }));
    } catch (err) {
      logger.error({ err }, "Error fetching user likes (Prisma)");
      throw err;
    }
  }
}
