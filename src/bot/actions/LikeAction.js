import { Composer, Markup } from "telegraf";
import catService from "../../services/CatService.js";

class LikeAction {
  constructor() {
    this.composer = new Composer();
    this.register();
  }

  register() {
    this.composer.action(/^data-(.*?)$/, async (ctx) => {
      try {
        const catId = ctx.match[1];
        const userId = ctx.from.id.toString();
        const message = ctx.update.callback_query.message;

        // лайк с проверкой пользователя
        const likeAdded = await catService.addLikeToCat(catId, userId);

        if (!likeAdded) {
          // Если лайк уже был поставлен этим пользователем
          await ctx.answerCbQuery("Вы уже поставили лайк этому коту 😺");
          return;
        }

        const [likes] = await catService.getLikesForCat(catId);

        // Обновляем клавиатуру с новым числом лайков
        await ctx.editMessageReplyMarkup({
          inline_keyboard: [
            [
              Markup.button.url(
                "Википедия",
                message.reply_markup.inline_keyboard[0][0].url
              ),
              Markup.button.callback(`👍 ${likes.count}`, `data-${catId}`),
            ],
          ],
        });

        await ctx.answerCbQuery("Лайк засчитан!");
      } catch (error) {
        console.error("Ошибка при обработке лайка:", error);
        await ctx.answerCbQuery("Произошла ошибка");
      }
    });
  }

  middleware() {
    return this.composer;
  }
}

export default new LikeAction();
