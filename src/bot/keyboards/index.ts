import { Markup } from 'telegraf';

export const Keyboards = {
  mainMenu: () =>
    Markup.keyboard([
      ['🐾 Случайный кот', '❤️ Мои лайки'],
      ['🏆 Топ популярных', 'ℹ️ Помощь'],
    ]).resize(),

  catDetails: (wikipediaUrl: string | undefined, likesCount: number, catId: string) => {
    const buttons = [];
    if (wikipediaUrl) {
      buttons.push(Markup.button.url('Википедия', wikipediaUrl));
    }
    buttons.push(Markup.button.callback(`👍 ${likesCount}`, `data-${catId}`));
    return Markup.inlineKeyboard([buttons]);
  },

  likeDetails: (catId: string) =>
    Markup.inlineKeyboard([[Markup.button.callback('👍 Лайк', `data-${catId}`)]]),

  likesNavigation: (index: number, catId: string) =>
    Markup.inlineKeyboard([
      [
        Markup.button.callback('◀️ Предыдущий', `like_nav:prev:${index}`),
        Markup.button.callback('Следующий ▶️', `like_nav:next:${index}`),
      ],
      [Markup.button.callback('📝 Подробнее', `like_details:${catId}`)],
    ]),
};
