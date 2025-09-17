import { Markup } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import { getLeaderboard } from "../../application/use-cases/index.js";
import logger from "../../utils/logger.js";

export class TopCommand extends BaseCommand {
  constructor() {
    super("top", "Показать топ популярных пород котов");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx) => {
      try {
        const appCtx = this.createAppContext();
        const topCats = await getLeaderboard(appCtx, { limit: 10 }); // получаем топ-10 пород

        if (!topCats || topCats.length === 0) {
          await ctx.reply("Пока нет популярных пород в рейтинге 😿");
          return;
        }

        let message = "🏆 *Топ популярных пород котов*\n\n";

        topCats.forEach((cat, index) => {
          const medal =
            index === 0
              ? "🥇"
              : index === 1
              ? "🥈"
              : index === 2
              ? "🥉"
              : `${index + 1}.`;
          message += `${medal} *${cat.breed_name}* - ${cat.count} ❤️\n`;
        });

        message += "\nНажмите кнопку ниже, чтобы узнать подробности о породе.";

        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "📊 Детали о породе",
              `like_details:${topCats[0].id}`
            ),
          ],
        ]);

        //сообщение с фото топовой породы и кнопками
        await ctx.replyWithPhoto(
          { url: topCats[0].image_url },
          {
            caption: message,
            parse_mode: "Markdown",
            ...keyboard,
          }
        );
      } catch (error) {
        logger.error(
          { err: error, userId: ctx.from?.id },
          "TopCommand: failed to fetch leaderboard"
        );
        await ctx.reply(
          "Извините, произошла ошибка при получении рейтинга популярных пород"
        );
      }
    });
  }
}

export default new TopCommand();
