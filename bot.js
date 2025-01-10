import { Telegraf } from "telegraf";
import { incrementMessageCount } from "./util/messageCounter.js";
import Fact from "./commands/Fact.js";
import Menu from "./commands/Menu.js";
import messageLike from "./util/messageLike.js";
import config from "./config.js";

const bot = new Telegraf(config.BOT_TOKEN);

bot.use((ctx, next) => {
  incrementMessageCount();
  return next();
});

const commands = [
  { command: "fact", description: "Получить факт о кошке" },
  { command: "menu", description: "Показать меню" },
];

bot.telegram.setMyCommands(commands);
bot.use(Fact, Menu, messageLike);

bot.start((ctx) =>
  ctx.reply("Привет! Я бот с фактами о кошках. Используй /menu для навигации")
);

const shutdown = () => {
  console.log("Выключение бота...");
  bot.stop("SIGTERM");
  process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

try {
  bot.launch();
  console.log("Бот успешно запущен");
} catch (error) {
  console.error("Ошибка при запуске бота:", error);
  process.exit(1);
}
