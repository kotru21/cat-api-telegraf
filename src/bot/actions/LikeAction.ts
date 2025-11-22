import { Composer, Markup, Context } from "telegraf";
import { AwilixContainer } from "awilix";
import logger from "../../utils/logger.js";

class LikeAction {
  private composer: Composer<any>;
  private container: AwilixContainer | null;

  constructor() {
    this.composer = new Composer();
    this.container = null;
  }

  setContainer(container: AwilixContainer) {
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
    this.composer.action(/^data-(.*?)$/, async (ctx: Context) => {
      try {
        // @ts-ignore
        const catId = ctx.match[1];
        if (!ctx.from) return;
        const userId = ctx.from.id.toString();
        // @ts-ignore
        const message = ctx.update.callback_query.message;

        const appCtx = this.createAppContext();
        // like via service
        const likeAdded = await appCtx.likeService.addLikeToCat(catId, userId);

        if (!likeAdded) {
          // Если лайк уже был поставлен этим пользователем
          await ctx.answerCbQuery("Вы уже поставили лайк этому коту 😺");
          return;
        }

        const likes = await appCtx.likeService.getLikesForCat(catId);

        // Обновляем клавиатуру с новым числом лайков
        // @ts-ignore
        const existingKeyboard = message.reply_markup.inline_keyboard;
        // Пытаемся сохранить первую кнопку (Википедия), если она есть
        const firstButton =
          existingKeyboard && existingKeyboard[0] && existingKeyboard[0][0];

        const buttons = [];
        if (firstButton && firstButton.url) {
          buttons.push(Markup.button.url("Википедия", firstButton.url));
        }
        buttons.push(Markup.button.callback(`👍 ${likes}`, `data-${catId}`));

        await ctx.editMessageReplyMarkup({
          inline_keyboard: [buttons],
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
