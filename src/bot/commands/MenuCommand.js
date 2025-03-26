import { Markup } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";
import config from "../../config/index.js";

export class MenuCommand extends BaseCommand {
  constructor() {
    super("menu", "Показать меню");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx) => {
      return await ctx.reply(
        "🐱 *Главное меню CatBot* 🐱\n\nВыберите действие из меню ниже:",
        {
          parse_mode: "Markdown",
          ...Markup.keyboard([
            ["🐾 Случайный кот", "❤️ Мои лайки"],
            ["🏆 Топ популярных", "ℹ️ Помощь"],
          ]).resize(),
        }
      );
    });

    // Обработчики текстовых команд меню
    this.composer.hears("🐾 Случайный кот", (ctx) => ctx.command.fact());
    this.composer.hears("❤️ Мои лайки", (ctx) => ctx.command.mylikes());
    this.composer.hears("🏆 Топ популярных", (ctx) => ctx.command.top());
    this.composer.hears("ℹ️ Помощь", (ctx) => {
      return ctx.reply(
        "*Справка по командам бота*\n\n" +
          "🐾 */fact* - получить случайную породу кота с описанием\n" +
          "❤️ */mylikes* - просмотреть котов, которым вы поставили лайки\n" +
          "🏆 */top* - показать топ самых популярных пород котов\n" +
          "📋 */menu* - вернуться в это меню\n\n" +
          `Вы также можете посетить наш [веб-сайт](${config.FULL_WEBSITE_URL}) для просмотра рейтинга котов!`,
        {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }
      );
    });
  }
}

export default new MenuCommand();
