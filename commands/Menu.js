import { Composer, Markup } from "telegraf";

export default Composer.command("menu", async (ctx) => {
  return await ctx.reply(
    "Если меню не включилось, обнови тг. Pure Genius.",
    Markup.keyboard([
      ["/fact"], // Row1 with 2 buttons
    ]).resize()
  );
});
