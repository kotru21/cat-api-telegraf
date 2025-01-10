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
    const catObject = await getFact();
    const [likes] = await getLikes(catObject.id);

    await ctx.replyWithPhoto(
      { url: catObject.url },
      {
        parse_mode: "Markdown",
        caption: `_${catObject.breeds[0].name}_.\n${catObject.breeds[0].description}`,
        reply_markup: createKeyboard(
          catObject.breeds[0].wikipedia_url,
          likes.count,
          catObject.id
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
