import { Composer, Markup, Context } from "telegraf";
import logger from "../../utils/logger.js";
import { LikeService } from "../../services/LikeService.js";

export class LikeAction {
  private composer: Composer<any>;
  private likeService: LikeService;

  constructor({ likeService }: { likeService: LikeService }) {
    this.composer = new Composer();
    this.likeService = likeService;
    this.register();
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

        // like via service
        const likeAdded = await this.likeService.addLikeToCat(catId, userId);

        if (!likeAdded) {
          // Если лайк уже был поставлен этим пользователем
          await ctx.answerCbQuery("Вы уже поставили лайк этому коту 😺");
          return;
        }

        const likes = await this.likeService.getLikesForCat(catId);

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

export default LikeAction;
