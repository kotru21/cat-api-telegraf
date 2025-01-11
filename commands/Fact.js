import { Composer, Markup } from "telegraf";
import getFact from "../util/Fetch.js";
import getLikes from "../util/getLikes.js";

const createKeyboard = (wikipediaUrl, likesCount, catId) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.url("Википедия", wikipediaUrl),
      Markup.button.callback(`👍 ${likesCount}`, `data-${catId}`),
    ],
  ]);
};

export default Composer.command("fact", async (ctx) => {
  try {
    const catData = await getFact();
    const breed = catData.breeds[0];
    const [likes] = await getLikes(catData.id);

    await ctx.replyWithPhoto(
      { url: catData.url },
      {
        parse_mode: "Markdown",
        caption: `_${breed.name}_\n${breed.description}`,
        ...createKeyboard(breed.wikipedia_url, likes?.count || 0, catData.id),
      }
    );
  } catch (error) {
    console.error("Ошибка при получении факта:", error);
    await ctx.reply(
      "Извините, произошла ошибка при получении информации о породе кошки"
    );
  }
});
