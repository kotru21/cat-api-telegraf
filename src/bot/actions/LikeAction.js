import { Composer, Markup } from "telegraf";
import logger from "../../utils/logger.js";

class LikeAction {
  constructor() {
    this.composer = new Composer();
    this.container = null;
  }

  setContainer(container) {
    this.container = container;
    this.register();
  }

  createAppContext() {
    if (!this.container) {
      throw new Error(
        "LikeAction: container is not set. Call setContainer() first."
      );
    }
    return {
      likeService: this.container.resolve("likeService"),
      leaderboardService: this.container.resolve("leaderboardService"),
      catInfoService: this.container.resolve("catInfoService"),
    };
  }

  register() {
    this.composer.action(/^data-(.*?)$/, async (ctx) => {
      try {
        const catId = ctx.match[1];
        const userId = ctx.from.id.toString();
        const message = ctx.update.callback_query.message;

        const appCtx = this.createAppContext();
        // like via service
        const likeAdded = await appCtx.likeService.addLikeToCat(catId, userId);

        if (!likeAdded) {
          // Если лайк уже был поставлен этим пользователем
          await ctx.answerCbQuery("Вы уже поставили лайк этому коту 😺");
          return;
        }

        const [likes] = await appCtx.likeService.getLikesForCat(catId);

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
        logger.error(
          { err: error, userId: ctx.from?.id },
          "LikeAction: error handling like"
        );
        await ctx.answerCbQuery("Произошла ошибка");
      }
    });
  }

  middleware() {
    return this.composer;
  }
}

export default new LikeAction();
