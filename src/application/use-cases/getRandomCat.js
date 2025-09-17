import { ValidationError } from "../errors.js";

// Возвращает случайного кота, сохраняя детали в БД через сервисный слой
export async function getRandomCat(ctx, { retryCount = 0 } = {}) {
  if (!ctx?.catService) throw new ValidationError("catService is required");
  return ctx.catService.getRandomCat(retryCount);
}

export default getRandomCat;
