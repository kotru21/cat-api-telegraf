import dotenv from "dotenv";
dotenv.config(); // Setup .env

export default {
  BOT_TOKEN: process.env.BOT_TOKEN,
  CAT_API_TOKEN: process.env.CATAPI_KEY,
  WebServer: true,
  expressServerPort: process.env.PORT || 5200,
  websocketServerPort: process.env.PORT || 5200,
  apiPort: process.env.PORT || 5200,
  // Добавляем настройку для базового URL сайта
  WEBSITE_URL: process.env.WEBSITE_URL || "http://localhost",
  // Полный URL с портом (для локальной разработки)
  FULL_WEBSITE_URL:
    process.env.WEBSITE_URL || `http://localhost:${process.env.PORT || 5200}`,
  SESSION_SECRET: process.env.SESSION_SECRET || "your-secret-key-here",
};
