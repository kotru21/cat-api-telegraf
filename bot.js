import { Telegraf, Markup } from "telegraf";
import GetFact from "./util/fetch.js";
import GetLikes from "./util/GetLikes.js";
import AddLikes from "./util/AddLikes.js";

const apikey = "PLACE_YOUR_API_KEY_HERE";
const bot = new Telegraf(apikey);

bot.start((ctx) => ctx.reply("Крч, я написал это на Node за 1 ночь, да. Чекк /menu"));
bot.command("/menu", async (ctx) => {
  return await ctx.reply(
    "Если меню не включилось, обнови тг. Pure Genius.",
    Markup.keyboard([
      ["/fact"], // Row1 with 2 buttons
    ]).resize()
  );
});
bot.command("fact", async (ctx) => {
  GetFact().then((result) =>
    GetLikes(result.breeds[0].name).then(
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

                  Markup.button.callback(`👍 ${LikesCount[0].count}`, `data-${result.breeds[0].name}`),
                ],
              ],
            },
          }
        )
    )
  );
});
bot.action(/^data-(.*?)$/, (ctx) => {
  AddLikes(ctx.match[1]).then(
    (
      LikesCount //console.log(LikesCount[0].count)
    ) => {
      return ctx.answerCbQuery(`Param: ${ctx.match[1]}! 👍`);
    }
  );
});
// bot.action("btn-2", (ctx) => {
//   console.log(ctx);
// });

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
