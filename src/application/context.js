// Контейнер зависимостей для use-cases.
// ВАЖНО: контейнер устанавливается один раз приложением (index.js)
// через setAppContainer и далее только используется. Новые контейнеры
// внутри этого модуля НЕ создаются, чтобы избежать рассинхронизации синглтонов.

import logger from "../utils/logger.js";
import { AppError, ValidationError, NotFoundError } from "./errors.js";

let appContainer = null;

export function setAppContainer(container) {
  appContainer = container;
}

export function getContainer() {
  if (!appContainer) {
    throw new Error(
      "App DI container is not set. Call setAppContainer(container) during startup."
    );
  }
  return appContainer;
}

export function createAppContext(overrides = {}) {
  const c = getContainer();
  return {
    catService: overrides.catService || c.resolve("catService"),
  };
}

/**
 * Централизованная обработка ошибок для use-cases
 * Логирует ошибки и преобразует их в AppError если необходимо
 * @param {Function} useCaseFn - use-case функция для выполнения
 * @param {Object} context - контекст приложения
 * @param {Object} params - параметры для use-case
 * @param {Object} meta - метаинформация для логирования (userId, operation и т.д.)
 * @returns {Promise<any>} - результат выполнения use-case
 */
export async function executeUseCase(
  useCaseFn,
  context,
  params = {},
  meta = {}
) {
  try {
    return await useCaseFn(context, params);
  } catch (error) {
    // Логируем ошибку с контекстом
    logger.error(
      {
        err: error,
        useCase: useCaseFn.name,
        params: sanitizeParams(params),
        meta,
      },
      `Use case ${useCaseFn.name} failed`
    );

    // Если это уже AppError, пробрасываем как есть
    if (error instanceof AppError) {
      throw error;
    }

    // Преобразуем известные типы ошибок
    if (error.message?.includes("validation")) {
      throw new ValidationError(error.message);
    }

    if (
      error.message?.includes("not found") ||
      error.message?.includes("Not found")
    ) {
      throw new NotFoundError(error.message);
    }

    // Все остальные ошибки заворачиваем в AppError
    throw new AppError(`Internal error in ${useCaseFn.name}`, {
      code: "USE_CASE_ERROR",
      status: 500,
      cause: error,
    });
  }
}

/**
 * Очищает параметры от чувствительных данных для логирования
 * @param {Object} params - параметры для очистки
 * @returns {Object} - очищенные параметры
 */
function sanitizeParams(params) {
  const sensitive = ["password", "token", "secret", "apiKey"];
  const sanitized = { ...params };

  for (const key of sensitive) {
    if (sanitized[key]) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

export default createAppContext;
