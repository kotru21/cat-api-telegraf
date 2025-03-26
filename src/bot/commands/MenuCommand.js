import { Markup } from "telegraf";
import { BaseCommand } from "./BaseCommand.js";

export class MenuCommand extends BaseCommand {
  constructor() {
    super("menu", "Показать меню");
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx) => {
      return await ctx.reply(
        "Выберите команду из меню ниже:",
        Markup.keyboard([
          ["/fact"],
          ["/mylikes"],
          ["/top"], // Добавлена новая кнопка
        ]).resize()
      );
    });
  }
}

export default new MenuCommand();
