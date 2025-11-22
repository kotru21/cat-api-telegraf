import { Markup, Context } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import logger from "../../utils/logger.js";

export class FactCommand extends BaseCommand {
  constructor() {
    super("fact", "Получить факт о кошке");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx: Context) => {
      try {
        const appCtx = this.createAppContext();
        const catData = await appCtx.catInfoService.getRandomCat();
        const breed = catData.breeds[0];
        const likes = await appCtx.likeService.getLikesForCat(catData.id);

        await ctx.replyWithPhoto(
          { url: catData.url },
          {
            parse_mode: "Markdown",
            caption: `_${breed.name}_\n${breed.description}`,
            ...this.createKeyboard(breed.wikipedia_url, likes || 0, catData.id),
          }
        );
      } catch (error) {
        logger.error(
          { err: error, userId: ctx.from?.id },
          "Failed to fetch random cat fact"
        );
        await ctx.reply(
          "Извините, произошла ошибка при получении информации о породе кошки"
        );
      }
    });
  }

  createKeyboard(wikipediaUrl: string, likesCount: number, catId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.url("Википедия", wikipediaUrl),
        Markup.button.callback(`👍 ${likesCount}`, `data-${catId}`),
      ],
    ]);
  }
}

export default new FactCommand();
