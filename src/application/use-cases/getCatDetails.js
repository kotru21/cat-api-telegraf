import { ValidationError, NotFoundError } from "../errors.js";

export async function getCatDetails(ctx, { id }) {
  if (!id) throw new ValidationError("id is required");
  const cat = await ctx.catService.getCatById(id);
  if (!cat) throw new NotFoundError("Cat not found");
  return cat;
}
