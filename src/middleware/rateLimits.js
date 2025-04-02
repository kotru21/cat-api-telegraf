import rateLimit from "express-rate-limit";

export function createLimiters() {
  // Базовый лимитер для всех API-запросов
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // ограничение каждого IP до 100 запросов в окне
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов, пожалуйста, попробуйте позже" },
  });

  // Более строгие ограничения для некоторых эндпоинтов
  const leaderboardLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 минут
    max: 30, // ограничение до 30 запросов в окне
    message: {
      error:
        "Слишком много запросов к лидерборду, пожалуйста, попробуйте позже",
    },
  });

  return { apiLimiter, leaderboardLimiter };
}
