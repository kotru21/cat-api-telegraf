import { Context } from 'telegraf';
import { BaseCommand } from './BaseCommand.js';
import logger from '../../utils/logger.js';
import { CatInfoService } from '../../services/CatInfoService.js';
import { LikeService } from '../../services/LikeService.js';
import { sendCatPhoto, CAT_FETCH_ERROR_MESSAGE } from '../utils/sendCatPhoto.js';

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

        await sendCatPhoto({
          ctx,
          catData,
          likeService: this.likeService,
        });
      } catch (error) {
        logger.error({ err: error, userId: ctx.from?.id }, 'Failed to fetch random cat fact');
        await ctx.reply(CAT_FETCH_ERROR_MESSAGE);
      }
    });
  }
}
