import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf("PLACE-YOUR-API-KEY-HERE");
bot.start((ctx) => ctx.reply("Крч, я написал это на Node за 1 ночь, да"));
bot.command("/menu", async (ctx) => {
  return await ctx.reply(
    "this is text",
    Markup.keyboard([
      ["/fact"], // Row1 with 2 buttons
    ]).resize()
  );
});
bot.command("fact", async (ctx) => {
  GetFact().then((result) =>
    ctx.replyWithPhoto(
      {
        url: result.url,
      },
      {
        parse_mode: "Markdown",
        caption: `_${result.breeds[0].name}_.\n${result.breeds[0].description} `,
        ...Markup.inlineKeyboard([Markup.button.url("Википедиya", `${result.breeds[0].wikipedia_url}`)]),
      }
    )
  );
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

async function GetFact() {
  const response = await fetch("https://api.thecatapi.com/v1/images/search?has_breeds=1?api_key=PLACE-YOUR-API-KEY-HERE");

  const obj = await response.json();
  JSON.parse(JSON.stringify(obj));
  const response2 = await fetch("https://api.thecatapi.com/v1/images/" + obj[0].id);
  const obj2 = await response2.json();
  console.log(obj2);
  return obj2;
}
