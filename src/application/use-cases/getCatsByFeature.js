import { ValidationError } from "../errors.js";

export async function getCatsByFeature(ctx, { feature, value }) {
  if (!feature || !value)
    throw new ValidationError("feature and value are required");
  return await ctx.catService.getCatsByFeature(feature, value);
}
