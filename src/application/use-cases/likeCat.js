import { ValidationError } from "../errors.js";

export async function likeCat(ctx, { catId, userId }) {
  if (!catId) throw new ValidationError("catId is required");
  if (!userId) throw new ValidationError("userId is required");
  return await ctx.catService.addLikeToCat(catId, userId);
}
