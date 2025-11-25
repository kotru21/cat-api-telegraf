import { Context, Markup } from 'telegraf';
import logger from '../../../utils/logger.js';

/**
 * Shared like info interface
 */
export interface LikeInfo {
  cat_id: string;
  breed_name?: string | null;
  image_url?: string | null;
  likes_count?: number;
}

/**
 * Escape special characters for Telegram Markdown
 */
export function mdEscape(str: string | number | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/([_*\\`[\]()~>#+\-=|{}.!])/g, '\\$1');
}

/**
 * Fallback image URL when cat image is not available
 */
const FALLBACK_IMAGE_URL = 'https://placekitten.com/600/400';

/**
 * Build navigation keyboard for browsing user likes
 */
export function buildLikesNavigationKeyboard(index: number, catId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('◀️ Предыдущий', `like_nav:prev:${index}`),
      Markup.button.callback('Следующий ▶️', `like_nav:next:${index}`),
    ],
    [Markup.button.callback('📝 Подробнее', `like_details:${catId}`)],
  ]);
}

/**
 * Send or edit like info message with photo and navigation
 * Shared utility for MyLikesCommand and MenuCommand
 */
export async function sendLikeInfo(
  ctx: Context,
  userLikes: LikeInfo[],
  index: number,
  isEdit = false,
): Promise<void> {
  const likeInfo = userLikes[index];
  if (!likeInfo) return;

  const total = userLikes.length;
  const photoUrl = likeInfo.image_url || FALLBACK_IMAGE_URL;

  const caption =
    `*${mdEscape(likeInfo.breed_name || 'Без названия')}*\n\n` +
    `👍 Запись ${index + 1} из ${total}` +
    (likeInfo.likes_count !== undefined ? `\n❤️ Всего лайков: ${likeInfo.likes_count}` : '');

  const keyboard = buildLikesNavigationKeyboard(index, likeInfo.cat_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- telegraf callbackQuery types
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
    } catch {
      // If photo edit fails (e.g., same image), just update caption
      await ctx.editMessageCaption(caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup,
      });
    }
  } else {
    try {
      await ctx.replyWithPhoto({ url: photoUrl }, { caption, parse_mode: 'Markdown', ...keyboard });
    } catch (err) {
      logger.warn({ err }, 'sendLikeInfo: failed to send photo, fallback to text');
      await ctx.reply(caption, { parse_mode: 'Markdown' });
    }
  }
}
