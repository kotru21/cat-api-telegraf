<<<<<<< HEAD
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
dotenv.config();
//command imports
import Fact from "./commands/Fact.js";
import Menu from "./commands/Menu.js";
import MessageLike from "./util/MessageLike.js";
import rateLimit from "telegraf-ratelimit";
=======
import { Telegraf, Markup } from "telegraf";
import Webserver from "./util/webserver.js";
import GetFact from "./util/fetch.js";
import GetLikes from "./util/GetLikes.js";
import AddLikes from "./util/AddLikes.js";
>>>>>>> e4bc45b75c88b21cd4dc6b2f07a03951c873311f

// Set limit to 1 message per 2 seconds
const limitConfig = {
  window: 2000,
  limit: 1,
  onLimitExceeded: (ctx, next) => ctx.reply("Не спамь"),
};

const apiKey = process.env.API_KEY;
const bot = new Telegraf(apiKey);
bot.use(rateLimit(limitConfig));
bot.use(Fact, Menu, MessageLike);
bot.start((ctx) => ctx.reply("Крч, я написал это на Node за 1 ночь, да. Чекк /menu"));
<<<<<<< HEAD

=======
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
>>>>>>> e4bc45b75c88b21cd4dc6b2f07a03951c873311f
// bot.action("btn-2", (ctx) => {
//   console.log(ctx);
// });

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
