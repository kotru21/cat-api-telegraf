import { Markup } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import catService from "../../services/CatService.js";

export class FactCommand extends BaseCommand {
  constructor() {
    super("fact", "Получить факт о кошке");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx) => {
      try {
        const catData = await catService.getRandomCat();
        const breed = catData.breeds[0];
        const [likes] = await catService.getLikesForCat(catData.id);

        await ctx.replyWithPhoto(
          { url: catData.url },
          {
            parse_mode: "Markdown",
            caption: `_${breed.name}_\n${breed.description}`,
            ...this.createKeyboard(
              breed.wikipedia_url,
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
  }

  createKeyboard(wikipediaUrl, likesCount, catId) {
    return Markup.inlineKeyboard([
      [
        Markup.button.url("Википедия", wikipediaUrl),
        Markup.button.callback(`👍 ${likesCount}`, `data-${catId}`),
      ],
    ]);
  }
}

export default new FactCommand();
