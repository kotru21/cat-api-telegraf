import AddLikes from "./AddLikes.js";
import GetLikes from "../util/GetLikes.js";
import { Composer, Markup } from "telegraf";

export default Composer.action(/^data-(.*?)$/, (ctx) => {
  GetLikes(ctx.match[1]).then(
    (
      LikesCount //console.log(LikesCount[0].count)
    ) =>
      ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [
            Markup.button.callback(`👍 ${LikesCount[0].count+1}`, `data`),
          ],
        ],
      }
      ),
    AddLikes(ctx.match[1]).then(() => {
      console.log(ctx.match);
      return ctx.answerCbQuery(`Лайкнуто, id: ${ctx.match[1]}! 👍`);
    })
  )
});
