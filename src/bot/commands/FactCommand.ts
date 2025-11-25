import { Context } from 'telegraf';
import { BaseCommand } from './BaseCommand.js';
import logger from '../../utils/logger.js';
import { CatInfoService } from '../../services/CatInfoService.js';
import { LikeService } from '../../services/LikeService.js';
import { Keyboards } from '../keyboards/index.js';

export class FactCommand extends BaseCommand {
  private catInfoService: CatInfoService;
  private likeService: LikeService;

  constructor({
    catInfoService,
    likeService,
  }: {
    catInfoService: CatInfoService;
    likeService: LikeService;
  }) {
    super('fact', 'Получить факт о кошке');
    this.catInfoService = catInfoService;
    this.likeService = likeService;
    this.register();
  }

  register() {
    this.composer.command(this.name, async (ctx: Context) => {
      try {
        const catData = await this.catInfoService.getRandomCat();
        const breed = catData.breeds[0];
        const likes = await this.likeService.getLikesForCat(catData.id);

        await ctx.replyWithPhoto(
          { url: catData.url },
          {
            parse_mode: 'Markdown',
            caption: `_${breed.name}_\n${breed.description}`,
            ...Keyboards.catDetails(breed.wikipedia_url, likes || 0, catData.id),
          },
        );
      } catch (error) {
        logger.error({ err: error, userId: ctx.from?.id }, 'Failed to fetch random cat fact');
        await ctx.reply('Извините, произошла ошибка при получении информации о породе кошки');
      }
    });
  }
}
