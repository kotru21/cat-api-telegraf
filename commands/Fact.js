import { Composer, Markup } from "telegraf";
import GetFact from "../util/fetch.js";
import GetLikes from "../util/GetLikes.js";

export default Composer.command("fact", async (ctx) => {
  GetFact().then((result) =>
    GetLikes(result.id).then(
      (
        LikesCount //console.log(LikesCount[0].count)
      ) =>
        ctx.replyWithPhoto(
          {
            url: result.url,
          },
          {
            parse_mode: "Markdown",
            caption: `_${result.breeds[0].name}_.\n${result.breeds[0].description} `,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Википедиya", url: `${result.breeds[0].wikipedia_url}` },

                  Markup.button.callback(`👍 ${LikesCount[0].count}`, `data-${result.id}`),
                ],
              ],
            },
          }
        )
    )
  );
});
