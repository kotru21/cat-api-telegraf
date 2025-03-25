import { Markup } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import catService from "../../services/CatService.js";

export class MyLikesCommand extends BaseCommand {
  constructor() {
    super("mylikes", "Просмотреть мои лайки");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx) => {
      try {
        const userId = ctx.from.id.toString();
        const userLikes = await catService.getUserLikes(userId);

        if (!userLikes || userLikes.length === 0) {
          await ctx.reply("Вы еще не поставили ни одного лайка 😿");
          return;
        }

        // Отображаем первую запись с фото и кнопками навигации
        await this.sendLikeInfo(ctx, userLikes, 0);
      } catch (error) {
        console.error("Ошибка при получении лайков:", error);
        await ctx.reply(
          "Извините, произошла ошибка при получении списка ваших лайков"
        );
      }
    });

    // Обработчики кнопок навигации по лайкам
    this.composer.action(/^like_nav:(prev|next):(\d+)$/, async (ctx) => {
      try {
        const userId = ctx.from.id.toString();
        const userLikes = await catService.getUserLikes(userId);

        if (!userLikes || userLikes.length === 0) {
          await ctx.answerCbQuery("Список лайков пуст");
          return;
        }

        const action = ctx.match[1]; // prev или next
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
        console.error("Ошибка при навигации по лайкам:", error);
        await ctx.answerCbQuery("Произошла ошибка");
      }
    });

    this.composer.action(/^like_details:(.+)$/, async (ctx) => {
      try {
        const catId = ctx.match[1];
        const catDetails = await catService.getCatById(catId);

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
        console.error("Ошибка при получении подробностей о коте:", error);
        await ctx.answerCbQuery("Произошла ошибка при получении информации");
      }
    });
  }

  async sendLikeInfo(ctx, userLikes, index, isEdit = false) {
    const likeInfo = userLikes[index];
    const total = userLikes.length;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("◀️ Предыдущий", `like_nav:prev:${index}`),
        Markup.button.callback("Следующий ▶️", `like_nav:next:${index}`),
      ],
      [
        // Заменяем кнопку URL на callback-кнопку
        Markup.button.callback(
          "📝 Подробнее",
          `like_details:${likeInfo.cat_id}`
        ),
      ],
    ]);

    const caption = `*${likeInfo.breed_name}*\n\n👍 Лайк ${
      index + 1
    } из ${total}`;

    if (isEdit && ctx.callbackQuery && ctx.callbackQuery.message) {
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

export default new MyLikesCommand();
