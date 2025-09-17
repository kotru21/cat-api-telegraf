import { ValidationError } from "../errors.js";

export async function getUserLikes(ctx, { userId }) {
  if (!userId) throw new ValidationError("userId is required");
  return await ctx.catService.getUserLikes(userId);
}
