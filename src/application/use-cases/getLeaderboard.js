export async function getLeaderboard(ctx, { limit = 10 } = {}) {
  return await ctx.catService.getLeaderboard(limit);
}
