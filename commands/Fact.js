import { Composer, Markup } from "telegraf";
import getFact from "../util/Fetch.js";
import GetLikes from "../util/GetLikes.js";

export default Composer.command("fact", async (ctx) => {
  getFact().then((catObject) =>
    GetLikes(catObject.id).then((likesCount) =>
      ctx.replyWithPhoto(
        {
          url: catObject.url,
        },
        {
          parse_mode: "Markdown",
          caption: `_${catObject.breeds[0].name}_.\n${catObject.breeds[0].description} `,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Википедиya", url: `${catObject.breeds[0].wikipedia_url}` },

                Markup.button.callback(`👍 ${likesCount[0].count}`, `data-${catObject.id}`),
              ],
            ],
          },
        }
      )
    )
  );
});
