export async function getRandomImages(ctx, { count = 3 } = {}) {
  return await ctx.catService.getRandomImages(count);
}
