import { Markup } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import {
  getRandomCat,
  getLikesForCat,
} from "../../application/use-cases/index.js";
import logger from "../../utils/logger.js";

export class FactCommand extends BaseCommand {
  constructor() {
    super("fact", "Получить факт о кошке");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx) => {
      try {
        const catData = await this.executeUseCase(getRandomCat, {}, ctx);
        const breed = catData.breeds[0];
        const [likes] = await this.executeUseCase(
          getLikesForCat,
          { catId: catData.id },
          ctx
        );

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
