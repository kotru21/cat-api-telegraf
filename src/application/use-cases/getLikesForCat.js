import { ValidationError } from "../errors.js";

export async function getLikesForCat(ctx, { catId }) {
  if (!catId) throw new ValidationError("catId is required");
  if (!ctx?.catService) throw new ValidationError("catService is required");
  return ctx.catService.getLikesForCat(catId);
}

export default getLikesForCat;
