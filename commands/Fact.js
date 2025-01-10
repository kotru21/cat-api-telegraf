import { Composer, Markup } from "telegraf";
import getFact from "../util/Fetch.js";
import getLikes from "../util/getLikes.js";

const createKeyboard = (wikipediaUrl, likesCount, catId) => {
  return {
    inline_keyboard: [
      [
        { text: "Википедиya", url: wikipediaUrl },
        Markup.button.callback(`👍 ${likesCount}`, `data-${catId}`),
      ],
    ],
  };
};

export default Composer.command("fact", async (ctx) => {
  try {
    const catData = await getFact();
    const [likes] = await getLikes(catData.id);

    await ctx.replyWithPhoto(
      { url: catData.url },
      {
        parse_mode: "Markdown",
        caption: `_${catData.breed_name}_.\n${catData.description}`,
        reply_markup: createKeyboard(
          catData.wikipedia_url,
          likes?.count || 0,
          catData.id
        ),
      }
    );
  } catch (error) {
    console.error("Ошибка при получении факта:", error);
    await ctx.reply(
      "Извините, произошла ошибка при получении информации о породе кошки"
    );
  }
});
