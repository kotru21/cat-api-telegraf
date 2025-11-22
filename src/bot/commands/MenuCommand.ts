import { Markup, Context } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";

export class MenuCommand extends BaseCommand {
  constructor() {
    super("menu", "Показать меню");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx: Context) => {
      return await ctx.reply(
        "🐱 *Главное меню CatBot* 🐱\n\nВыберите действие из меню ниже:",
        {
          parse_mode: "Markdown",
          ...Markup.keyboard([
            ["🐾 Случайный кот", "❤️ Мои лайки"],
            ["🏆 Топ популярных", "ℹ️ Помощь"],
          ]).resize(),
        }
      );
    });

    // Обработчики текстовых команд меню - прямые обработчики
    this.composer.hears("🐾 Случайный кот", async (ctx: Context) => {
      await ctx.reply("Получаю случайного кота...");
      // Имитируем обработку команды /fact
      try {
        const appCtx = this.createAppContext();
        const catData = await appCtx.catInfoService.getRandomCat();
        const breed = catData.breeds[0];
        const [likes] = await appCtx.likeService.getLikesForCat(catData.id);

        await ctx.replyWithPhoto(
          { url: catData.url },
          {
            parse_mode: "Markdown",
            caption: `_${breed.name}_\n${breed.description}`,
            ...Markup.inlineKeyboard([
              [
                Markup.button.url("Википедия", breed.wikipedia_url),
                Markup.button.callback(
                  `👍 ${likes?.count || 0}`,
                  `data-${catData.id}`
                ),
              ],
            ]),
          }
        );
      } catch (error) {
        logger.error({ err: error }, "MenuCommand: failed to fetch random cat");
        await ctx.reply(
          "Извините, произошла ошибка при получении информации о породе кошки"
        );
      }
    });

    this.composer.hears("❤️ Мои лайки", async (ctx: Context) => {
      await ctx.reply("Загружаю ваши лайки...");
      // Прямой вызов кода обработки команды
      try {
        if (!ctx.from) return;
        const userId = ctx.from.id.toString();
        const appCtx = this.createAppContext();
        const userLikes = await appCtx.likeService.getUserLikes(userId);

        if (!userLikes || userLikes.length === 0) {
          await ctx.reply("Вы еще не поставили ни одного лайка 😿");
          return;
        }

        // Отображаем первую запись с фото и кнопками навигации
        await this.sendLikeInfo(ctx, userLikes, 0);
      } catch (error) {
        logger.error({ err: error }, "MenuCommand: failed to fetch user likes");
        await ctx.reply(
          "Извините, произошла ошибка при получении списка ваших лайков"
        );
      }
    });

    this.composer.hears("🏆 Топ популярных", async (ctx: Context) => {
      await ctx.reply("Загружаю рейтинг...");
      // Прямой вызов кода обработки команды
      try {
        const appCtx = this.createAppContext();
        const topCats = await appCtx.leaderboardService.getLeaderboard(10);

        if (!topCats || topCats.length === 0) {
          await ctx.reply("Пока нет популярных пород в рейтинге 😿");
          return;
        }

        let message = "🏆 *Топ популярных пород котов*\n\n";

        topCats.forEach((cat: any, index: number) => {
          const medal =
            index === 0
              ? "🥇"
              : index === 1
              ? "🥈"
              : index === 2
              ? "🥉"
              : `${index + 1}.`;
          message += `${medal} *${cat.breed_name}* - ${cat.count} ❤️\n`;
        });

        message += "\nНажмите кнопку ниже, чтобы узнать подробности о породе.";

        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "📊 Детали о породе",
              `like_details:${topCats[0].id}`
            ),
          ],
        ]);

        await ctx.replyWithPhoto(
          { url: topCats[0].image_url },
          {
            caption: message,
            parse_mode: "Markdown",
            ...keyboard,
          }
        );
      } catch (error) {
        logger.error(
          { err: error },
          "MenuCommand: failed to fetch leaderboard"
        );
        await ctx.reply(
          "Извините, произошла ошибка при получении рейтинга популярных пород"
        );
      }
    });

    this.composer.hears("ℹ️ Помощь", (ctx: Context) => {
      return ctx.reply(
        "*Справка по командам бота*\n\n" +
          "🐾 */fact* - получить случайную породу кота с описанием\n" +
          "❤️ */mylikes* - просмотреть котов, которым вы поставили лайки\n" +
          "🏆 */top* - показать топ самых популярных пород котов\n" +
          "📋 */menu* - вернуться в это меню\n\n" +
          `Вы также можете посетить [сайт](${config.WEBSITE_URL}) для просмотра рейтинга котов!`,
        {
          parse_mode: "Markdown",
          link_preview_options: { is_disabled: true },
        }
      );
    });

    // Обработчики кнопок навигации по лайкам
    this.composer.action(
      /^like_nav:(prev|next):(\d+)$/,
      async (ctx: Context) => {
        try {
          if (!ctx.from) return;
          const userId = ctx.from.id.toString();
          const appCtx = this.createAppContext();
          const userLikes = await appCtx.likeService.getUserLikes(userId);

          if (!userLikes || userLikes.length === 0) {
            await ctx.answerCbQuery("Список лайков пуст");
            return;
          }

          // @ts-ignore
          const action = ctx.match[1]; // prev или next
          // @ts-ignore
          let currentIndex = parseInt(ctx.match[2]);

          if (action === "next") {
            currentIndex = (currentIndex + 1) % userLikes.length;
          } else {
            currentIndex =
              (currentIndex - 1 + userLikes.length) % userLikes.length;
          }

          await this.sendLikeInfo(ctx, userLikes, currentIndex, true);
          await ctx.answerCbQuery();
        } catch (error) {
          logger.error({ err: error }, "MenuCommand: likes navigation error");
          await ctx.answerCbQuery("Произошла ошибка");
        }
      }
    );

    this.composer.action(/^like_details:(.+)$/, async (ctx: Context) => {
      try {
        // @ts-ignore
        const catId = ctx.match[1];
        const appCtx = this.createAppContext();
        const catDetails = await appCtx.catInfoService.getCatById(catId);

        if (!catDetails) {
          await ctx.answerCbQuery("Информация о коте не найдена");
          return;
        }

        // сообщение с подробной информацией
        const detailsMessage =
          `*${catDetails.breed_name}*\n\n` +
          `*Описание:* ${catDetails.description}\n\n` +
          `*Происхождение:* ${catDetails.origin}\n` +
          `*Темперамент:* ${catDetails.temperament}\n` +
          `*Продолжительность жизни:* ${catDetails.life_span}\n` +
          `*Вес:* ${catDetails.weight_imperial} фунтов (${catDetails.weight_metric} кг)\n` +
          `*Количество лайков:* ${catDetails.count}\n\n` +
          `[Подробнее на Википедии](${catDetails.wikipedia_url})`;

        await ctx.replyWithPhoto(
          { url: catDetails.image_url },
          {
            caption: detailsMessage,
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.callback("👍 Лайк", `data-${catDetails.id}`)],
            ]),
          }
        );

        await ctx.answerCbQuery("Подробная информация о коте");
      } catch (error) {
        logger.error(
          { err: error },
          "MenuCommand: failed to fetch cat details"
        );
        await ctx.answerCbQuery("Произошла ошибка при получении информации");
      }
    });
  }

  // Вспомогательный метод для MyLikesCommand
  async sendLikeInfo(
    ctx: Context,
    userLikes: any[],
    index: number,
    isEdit = false
  ) {
    const likeInfo = userLikes[index];
    const total = userLikes.length;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("◀️ Предыдущий", `like_nav:prev:${index}`),
        Markup.button.callback("Следующий ▶️", `like_nav:next:${index}`),
      ],
      [
        Markup.button.callback(
          "📝 Подробнее",
          `like_details:${likeInfo.cat_id}`
        ),
      ],
    ]);

    const caption = `*${likeInfo.breed_name}*\n\n👍 Лайк ${
      index + 1
    } из ${total}`;

    if (isEdit && ctx.callbackQuery && (ctx.callbackQuery as any).message) {
      try {
        await ctx.editMessageMedia(
          {
            type: "photo",
            media: likeInfo.image_url,
            caption: caption,
            parse_mode: "Markdown",
          },
          { reply_markup: keyboard.reply_markup }
        );
      } catch (error) {
        // Если не удалось отредактировать (например, фото такое же), просто обновляем подпись
        await ctx.editMessageCaption(caption, {
          parse_mode: "Markdown",
          reply_markup: keyboard.reply_markup,
        });
      }
    } else {
      await ctx.replyWithPhoto(
        { url: likeInfo.image_url },
        {
          caption: caption,
          parse_mode: "Markdown",
          ...keyboard,
        }
      );
    }
  }
}

export default new MenuCommand();
