import { Context } from 'telegraf';
import { CatApiImage } from '../../api/interfaces/TheCatApi.js';
import { LikeService } from '../../services/LikeService.js';
import { Keyboards } from '../keyboards/index.js';
import logger from '../../utils/logger.js';

export interface SendCatPhotoOptions {
  ctx: Context;
  catData: CatApiImage;
  likeService: LikeService;
}

/**
 * Sends a cat photo with breed information and like buttons
 * Reusable utility to avoid code duplication across commands
 */
export async function sendCatPhoto({
  ctx,
  catData,
  likeService,
}: SendCatPhotoOptions): Promise<void> {
  const breed = catData.breeds?.[0];

  if (!breed) {
    logger.warn({ catId: catData.id }, 'Cat data has no breed information');
    await ctx.reply('Извините, не удалось получить информацию о породе кошки');
    return;
  }

  const likes = await likeService.getLikesForCat(catData.id);

  await ctx.replyWithPhoto(
    { url: catData.url },
    {
      parse_mode: 'Markdown',
      caption: `_${breed.name}_\n${breed.description}`,
      ...Keyboards.catDetails(breed.wikipedia_url, likes || 0, catData.id),
    },
  );
}

/**
 * Error message for cat fetch failures
 */
export const CAT_FETCH_ERROR_MESSAGE =
  'Извините, произошла ошибка при получении информации о породе кошки';
