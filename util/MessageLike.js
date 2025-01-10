import AddLikes from "../util/addLikes.js";
import GetLikes from "../util/getLikes.js";
import { Composer, Markup } from "telegraf";

export default Composer.action(/^data-(.*?)$/, async (ctx) => {
  try {
    const catId = ctx.match[1];

    // add like
    await AddLikes(catId);

    // Get updated likes count
    const likes = await GetLikes(catId);
    const likesCount = likes[0].count;

    // Update the message with the new likes count
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [Markup.button.callback(`👍 ${likesCount}`, `data-${catId}`)],
      ],
    });

    // Send a notification to the user
    await ctx.answerCbQuery(`Лайкнуто! 👍`);
  } catch (error) {
    console.error("Ошибка при обработке лайка:", error);
    await ctx.answerCbQuery("Произошла ошибка при обработке лайка");
  }
});
