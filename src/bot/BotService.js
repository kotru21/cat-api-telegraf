import { Telegraf } from "telegraf";
import RateLimitMiddleware from "telegraf-ratelimit";
import { incrementMessageCount } from "../utils/messageCounter.js";
import logger from "../utils/logger.js";

export class BotService {
  constructor(config, commands = [], container = null) {
    this.config = config;
    this.commands = commands;
    this.container = container;
    this.bot = null;
  }

  initialize() {
    if (!this.config.BOT_TOKEN) {
      throw new Error("BOT_TOKEN is required to initialize the bot");
    }
    this.bot = new Telegraf(this.config.BOT_TOKEN);

    // Rate limits
    const limitConfig = {
      window: 3000,
      limit: 3,
      onLimitExceeded: (ctx) =>
        ctx.reply("Пожалуйста, не отправляйте команды так часто 🙏"),
    };

    this.bot.use(new RateLimitMiddleware(limitConfig));

    // Message counter middleware
    this.bot.use((ctx, next) => {
      incrementMessageCount();
      return next();
    });

    // Register command middlewares
    this.commands.forEach((command) => {
      // Передаем контейнер в команды, если они поддерживают setContainer
      if (this.container && typeof command.setContainer === "function") {
        command.setContainer(this.container);
      }
      this.bot.use(command.middleware());
    });

    // Global error handler для бота
    this.bot.catch((err, ctx) => {
      logger.error(
        {
          err,
          userId: ctx.from?.id,
          username: ctx.from?.username,
          command: ctx.message?.text,
        },
        "Bot command error"
      );

      return ctx
        .reply("Произошла ошибка при выполнении команды. Попробуйте позже.", {
          reply_to_message_id: ctx.message?.message_id,
        })
        .catch((replyErr) => {
          logger.error(
            { err: replyErr },
            "Failed to send error message to user"
          );
        });
    });

    // /start handler
    this.bot.start((ctx) => ctx.reply("Hi! Use /menu to navigate."));

    return this.bot;
  }

  async launch() {
    if (!this.bot) {
      this.initialize();
    }
    await this.bot.launch();
    logger.info("Bot launched successfully");
    return this.bot;
  }

  stop(reason = "SIGTERM") {
    if (this.bot) {
      this.bot.stop(reason);
      logger.info({ reason }, "Bot stopped");
    }
  }
}
