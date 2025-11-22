import { Markup, Context } from 'telegraf';
import { BaseCommand } from './BaseCommand.js';
import logger from '../../utils/logger.js';
import { LikeService } from '../../services/LikeService.js';
import { CatInfoService } from '../../services/CatInfoService.js';

// Простая in-memory кэш структура для лайков пользователя
// key: userId -> { data: [...], ts: number }
const userLikesCache = new Map<string, { data: any[]; ts: number }>();
const USER_LIKES_TTL_MS = 30_000; // 30 секунд

// Защита от спама навигационными callback (userId -> boolean processing)
const navigationLocks = new Map<string, boolean>();

// Базовый санитайзер для Markdown (Telegram classic) — экранируем спецсимволы
function mdEscape(str: string | number | null | undefined) {
  if (!str) return '';
  return String(str).replace(/([_*\\`[\]()~>#+\-=|{}.!])/g, '\\$1');
}

export class MyLikesCommand extends BaseCommand {
  private likeService: LikeService;
  private catInfoService: CatInfoService;

  constructor({
    likeService,
    catInfoService,
  }: {
    likeService: LikeService;
    catInfoService: CatInfoService;
  }) {
    super('mylikes', 'Просмотреть мои лайки');
    this.likeService = likeService;
    this.catInfoService = catInfoService;
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx: Context) => {
      try {
        if (!ctx.from) return;
        const userId = ctx.from.id.toString();
        const userLikes = await this.getCachedUserLikes(userId, ctx);

        if (!userLikes || userLikes.length === 0) {
          await ctx.reply('Вы еще не поставили ни одного лайка 😿');
          return;
        }

        await this.sendLikeInfo(ctx, userLikes, 0);
      } catch (error) {
        logger.error({ err: error, userId: ctx.from?.id }, 'MyLikesCommand: failed to fetch likes');
        await ctx.reply('Извините, произошла ошибка при получении списка ваших лайков');
      }
    });

    // Обработчики кнопок навигации по лайкам
    this.composer.action(/^like_nav:(prev|next):(\d+)$/, async (ctx: Context) => {
      try {
        if (!ctx.from) return;
        const userId = ctx.from.id.toString();

        if (navigationLocks.get(userId)) {
          await ctx.answerCbQuery('Подождите...');
          return;
        }
        navigationLocks.set(userId, true);

        const userLikes = await this.getCachedUserLikes(userId, ctx);

        if (!userLikes || userLikes.length === 0) {
          await ctx.answerCbQuery('Список лайков пуст');
          navigationLocks.delete(userId);
          return;
        }

        // @ts-expect-error - ctx.match is not typed
        const action = ctx.match[1]; // prev или next
        // @ts-expect-error - ctx.match is not typed
        let currentIndex = parseInt(ctx.match[2]);

        if (action === 'next') {
          currentIndex = (currentIndex + 1) % userLikes.length;
        } else {
          currentIndex = (currentIndex - 1 + userLikes.length) % userLikes.length;
        }

        logger.debug(
          { userId, action, currentIndex, total: userLikes.length },
          'MyLikesCommand: navigation',
        );

        await this.sendLikeInfo(ctx, userLikes, currentIndex, true);
        await ctx.answerCbQuery();
        navigationLocks.delete(userId);
      } catch (error) {
        logger.error(
          { err: error, userId: ctx.from?.id },
          'MyLikesCommand: likes navigation error',
        );
        await ctx.answerCbQuery('Произошла ошибка');
        if (ctx.from) {
          navigationLocks.delete(ctx.from.id.toString());
        }
      }
    });

    this.composer.action(/^like_details:(.+)$/, async (ctx: Context) => {
      try {
        // @ts-expect-error - ctx.match is not typed
        const catId = ctx.match[1];
        const catDetails = await this.catInfoService.getCatById(catId);

        if (!catDetails) {
          await ctx.answerCbQuery('Информация о коте не найдена');
          return;
        }

        // сообщение с подробной информацией
        const detailsMessage =
          `*${mdEscape(catDetails.breed_name)}*\n\n` +
          (catDetails.description
            ? `*Описание:* ${mdEscape(limitText(catDetails.description, 600))}\n\n`
            : '') +
          (catDetails.origin ? `*Происхождение:* ${mdEscape(catDetails.origin)}\n` : '') +
          (catDetails.temperament ? `*Темперамент:* ${mdEscape(catDetails.temperament)}\n` : '') +
          (catDetails.life_span
            ? `*Продолжительность жизни:* ${mdEscape(catDetails.life_span)}\n`
            : '') +
          (catDetails.weight_imperial || catDetails.weight_metric
            ? `*Вес:* ${mdEscape(
                catDetails.weight_imperial || '?',
              )} фунтов (${mdEscape(catDetails.weight_metric || '?')} кг)\n`
            : '') +
          `*Количество лайков:* ${catDetails.count}\n\n` +
          (catDetails.wikipedia_url ? `[Подробнее на Википедии](${catDetails.wikipedia_url})` : '');

        const photoUrl = catDetails.image_url || this.getFallbackImage();

        try {
          await ctx.replyWithPhoto(
            { url: photoUrl },
            {
              caption: detailsMessage,
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([
                [Markup.button.callback('👍 Лайк', `data-${catDetails.id}`)],
              ]),
            },
          );
        } catch (err) {
          logger.warn({ err }, 'MyLikesCommand: failed to send details photo, fallback to text');
          await ctx.reply(detailsMessage, { parse_mode: 'Markdown' });
        }

        await ctx.answerCbQuery('Подробная информация о коте');
      } catch (error) {
        logger.error({ err: error }, 'MyLikesCommand: failed to fetch details');
        await ctx.answerCbQuery('Произошла ошибка при получении информации');
      }
    });
  }

  async sendLikeInfo(ctx: Context, userLikes: any[], index: number, isEdit = false) {
    const likeInfo = userLikes[index];
    if (!likeInfo) return;
    const total = userLikes.length;
    const photoUrl = likeInfo.image_url || this.getFallbackImage();

    const caption =
      `*${mdEscape(likeInfo.breed_name || 'Без названия')}*\n\n` +
      `👍 Запись ${index + 1} из ${total}` +
      (likeInfo.likes_count !== undefined ? `\n❤️ Всего лайков: ${likeInfo.likes_count}` : '');

    const keyboard = this.buildNavigationKeyboard(index, likeInfo.cat_id);

    if (isEdit && ctx.callbackQuery && (ctx.callbackQuery as any).message) {
      try {
        await ctx.editMessageMedia(
          {
            type: 'photo',
            media: photoUrl,
            caption,
            parse_mode: 'Markdown',
          },
          { reply_markup: keyboard.reply_markup },
        );
      } catch (error) {
        await ctx.editMessageCaption(caption, {
          parse_mode: 'Markdown',
          reply_markup: keyboard.reply_markup,
        });
      }
    } else {
      try {
        await ctx.replyWithPhoto(
          { url: photoUrl },
          { caption, parse_mode: 'Markdown', ...keyboard },
        );
      } catch (err) {
        logger.warn({ err }, 'MyLikesCommand: failed to send photo, fallback to text');
        await ctx.reply(caption, { parse_mode: 'Markdown' });
      }
    }
  }

  buildNavigationKeyboard(index: number, catId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('◀️ Предыдущий', `like_nav:prev:${index}`),
        Markup.button.callback('Следующий ▶️', `like_nav:next:${index}`),
      ],
      [Markup.button.callback('📝 Подробнее', `like_details:${catId}`)],
    ]);
  }

  getFallbackImage() {
    // Можно заменить на внешний URL или статику, если бот деплоится без public
    return 'https://placekitten.com/600/400'; // универсальный fallback
  }

  async getCachedUserLikes(userId: string, ctx: Context) {
    const now = Date.now();
    const cached = userLikesCache.get(userId);
    if (cached && now - cached.ts < USER_LIKES_TTL_MS) {
      return cached.data;
    }
    // Обновляем из сервиса
    const data = await this.likeService.getUserLikes(userId);
    userLikesCache.set(userId, { data, ts: now });
    return data;
  }
}

export default MyLikesCommand;

// Вспомогательный лимитер текста (обрезаем по границе слова)
function limitText(text: string, max: number) {
  if (!text) return '';
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + '…';
}
