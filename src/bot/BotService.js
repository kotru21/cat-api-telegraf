import { Telegraf } from "telegraf";
import RateLimitMiddleware from "telegraf-ratelimit";
import { incrementMessageCount } from "../utils/messageCounter.js";

export class BotService {
  constructor(config, commands = []) {
    this.config = config;
    this.commands = commands;
    this.bot = null;
  }

  initialize() {
    this.bot = new Telegraf(this.config.BOT_TOKEN);

    // Настройка рейт-лимитов
    const limitConfig = {
      window: 3000, // 3 секунды
      limit: 3, // максимум 3 сообщения за период
      onLimitExceeded: (ctx) =>
        ctx.reply("Пожалуйста, не отправляйте команды так часто 🙏"),
    };

    this.bot.use(new RateLimitMiddleware(limitConfig));

    // Middleware для подсчета сообщений
    this.bot.use((ctx, next) => {
      incrementMessageCount();
      return next();
    });

    // Регистрация всех middleware команд
    this.commands.forEach((command) => {
      this.bot.use(command.middleware());
    });

    // Обработчик команды /start
    this.bot.start((ctx) =>
      ctx.reply(
        "Привет! Я бот с фактами о кошках. Используй /menu для навигации"
      )
    );

    return this.bot;
  }

  async launch() {
    if (!this.bot) {
      this.initialize();
    }
    await this.bot.launch();
    console.log("Бот успешно запущен");
    return this.bot;
  }

  stop(reason = "SIGTERM") {
    if (this.bot) {
      this.bot.stop(reason);
      console.log(`Бот остановлен (${reason})`);
    }
  }
}
