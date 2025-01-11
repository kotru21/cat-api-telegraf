import AddLikes from "./addlikes.js";
import GetLikes from "./getLikes.js";
import { Composer, Markup } from "telegraf";

export default Composer.action(/^data-(.*?)$/, async (ctx) => {
  try {
    const catId = ctx.match[1];
    const message = ctx.update.callback_query.message;
    const imageUrl = message.photo[0].file_id;
    const breedName = message.caption.split("\n")[0].replace("_", "");

    await AddLikes(catId, imageUrl, breedName);
    const [likes] = await GetLikes(catId);

    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [Markup.button.callback(`👍 ${likes.count}`, `data-${catId}`)],
      ],
    });

    await ctx.answerCbQuery("Лайк засчитан!");
  } catch (error) {
    console.error("Ошибка:", error);
    await ctx.answerCbQuery("Произошла ошибка");
  }
});
