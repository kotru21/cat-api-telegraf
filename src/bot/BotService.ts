import { Telegraf, Context, Middleware } from 'telegraf';
import rateLimit from 'telegraf-ratelimit';
import { incrementMessageCount } from '../utils/messageCounter.js';
import logger from '../utils/logger.js';
import { z } from 'zod';
import { EnvSchema } from '../config/schema.js';

export type AppConfig = z.infer<typeof EnvSchema>;

export interface BotModule {
  middleware(): Middleware<Context>;
}

export class BotService {
  private config: AppConfig;
  private commands: BotModule[];
  public bot: Telegraf<Context> | null;

  constructor({ config, commands = [] }: { config: AppConfig; commands: BotModule[] }) {
    this.config = config;
    this.commands = commands;
    this.bot = null;
  }

  initialize() {
    if (!this.config.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is required to initialize the bot');
    }
    this.bot = new Telegraf(this.config.BOT_TOKEN);

    // Rate limits
    const limitConfig = {
      window: 3000,
      limit: 3,
      onLimitExceeded: async (ctx: Context) => {
        await ctx.reply('Пожалуйста, не отправляйте команды так часто 🙏');
      },
    };

    this.bot.use(rateLimit(limitConfig));

    // Message counter middleware
    this.bot.use((ctx, next) => {
      incrementMessageCount();
      return next();
    });

    // Register command middlewares
    this.commands.forEach((command) => {
      this.bot!.use(command.middleware());
    });

    // Global error handler для бота
    this.bot.catch((err, ctx) => {
      const message = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
      logger.error(
        {
          err,
          userId: ctx.from?.id,
          username: ctx.from?.username,
          command: message,
        },
        'Bot command error',
      );

      ctx
        .reply('Произошла ошибка при выполнении команды. Попробуйте позже.', {
          // @ts-expect-error - reply_to_message_id type mismatch
          reply_to_message_id: ctx.message?.message_id,
        })
        .catch((replyErr) => {
          logger.error({ err: replyErr }, 'Failed to send error message to user');
        });
    });

    // /start handler
    this.bot.start((ctx) => ctx.reply('Hi! Use /menu to navigate.'));

    return this.bot;
  }

  async launch() {
    if (!this.bot) {
      this.initialize();
    }
    await this.bot!.launch();
    logger.info('Bot launched successfully');
    return this.bot;
  }

  stop(reason = 'SIGTERM') {
    if (this.bot) {
      this.bot.stop(reason);
      logger.info({ reason }, 'Bot stopped');
    }
  }
}
