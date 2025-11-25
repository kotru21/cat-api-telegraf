import { Context, NarrowedContext } from 'telegraf';
import { CallbackQuery, Message, Update } from 'telegraf/types';

/**
 * Контекст для action handlers с регулярным выражением
 * ctx.match содержит результат RegExp.exec()
 */
export interface RegexMatchContext extends Context {
  match: RegExpExecArray;
}

/**
 * Контекст для callback_query с доступом к message
 */
export interface CallbackQueryContext extends Context {
  update: Update.CallbackQueryUpdate<CallbackQuery>;
  callbackQuery: CallbackQuery & {
    message?: Message;
    data?: string;
  };
}

/**
 * Комбинированный контекст для action handlers
 * Используется в bot.action(/regex/, handler)
 */
export type ActionContext = NarrowedContext<Context, Update.CallbackQueryUpdate> & {
  match: RegExpExecArray;
};

/**
 * Типизированный контекст для навигационных action
 * Пример: like_nav:(prev|next):(\d+)
 */
export interface NavigationActionMatch {
  0: string; // полное совпадение
  1: 'prev' | 'next'; // направление
  2: string; // индекс (строка)
  index: number;
  input: string;
  groups?: Record<string, string>;
}

/**
 * Типизированный контекст для like_details action
 * Пример: like_details:(.+)
 */
export interface LikeDetailsActionMatch {
  0: string; // полное совпадение
  1: string; // catId
  index: number;
  input: string;
  groups?: Record<string, string>;
}

/**
 * Типизированный контекст для data action (лайки)
 * Пример: data-(.*)
 */
export interface DataActionMatch {
  0: string; // полное совпадение
  1: string; // catId
  index: number;
  input: string;
  groups?: Record<string, string>;
}

/**
 * Получить message из callback_query безопасно
 */
export function getCallbackMessage(ctx: Context): Message | undefined {
  if ('callback_query' in ctx.update && ctx.update.callback_query) {
    return ctx.update.callback_query.message as Message | undefined;
  }
  return undefined;
}
