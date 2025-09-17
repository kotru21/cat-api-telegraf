import { ValidationError } from "../errors.js";

export async function getUserLikesCount(ctx, { userId }) {
  if (!userId) throw new ValidationError("userId is required");
  return await ctx.catService.getUserLikesCount(userId);
}
