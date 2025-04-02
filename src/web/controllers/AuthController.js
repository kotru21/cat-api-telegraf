import crypto from "crypto";
import { URL } from "url";

export class AuthController {
  constructor(config) {
    this.config = config;
  }

  setupRoutes(app) {
    app.get("/auth/telegram/callback", this.handleTelegramCallback.bind(this));
    app.post(
      "/auth/telegram/callback",
      this.handleTelegramCallbackPost.bind(this)
    );

    // Добавляем маршрут для отладки (можно удалить в продакшн)
    if (process.env.NODE_ENV !== "production") {
      app.get("/auth/debug", (req, res) => {
        res.json({
          sessionActive: !!req.session.user,
          user: req.session.user || null,
        });
      });
    }
  }

  validateTelegramData(data) {
    try {
      const { hash, ...otherData } = data;

      // Проверяем наличие всех необходимых полей
      const requiredFields = ["id", "auth_date"];
      for (const field of requiredFields) {
        if (!otherData[field]) {
          console.error(`Отсутствует обязательное поле: ${field}`);
          return { isValid: false, error: "missing_fields" };
        }
      }

      // Проверка формата данных
      if (isNaN(parseInt(otherData.auth_date))) {
        console.error(`Неверный формат auth_date: ${otherData.auth_date}`);
        return { isValid: false, error: "invalid_format" };
      }

      // Проверка актуальности данных (не старше 24 часов)
      const authTimestamp = parseInt(otherData.auth_date);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const isTimeValid = currentTimestamp - authTimestamp <= 86400;

      if (!isTimeValid) {
        console.error(
          `Данные устарели: ${authTimestamp}, текущее время: ${currentTimestamp}`
        );
        return { isValid: false, error: "expired" };
      }

      // Проверка hash от Telegram
      if (!hash || typeof hash !== "string") {
        console.error(`Отсутствует или неверный формат hash: ${hash}`);
        return { isValid: false, error: "invalid_hash_format" };
      }

      // Получаем секретный ключ из токена бота
      const botToken = this.config.BOT_TOKEN;
      if (!botToken) {
        console.error("BOT_TOKEN отсутствует в конфигурации");
        return { isValid: false, error: "configuration_error" };
      }

      const secretKey = crypto.createHash("sha256").update(botToken).digest();

      // Формируем строку проверки согласно документации Telegram
      const dataCheckString = Object.keys(otherData)
        .sort()
        .map((key) => `${key}=${otherData[key]}`)
        .join("\n");

      // Вычисляем HMAC для проверки подписи
      const hmac = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      const isHashValid = hmac === hash;

      if (!isHashValid) {
        console.error(
          `Невалидный хеш. Ожидаемый: ${hmac}, Полученный: ${hash}`
        );
        console.debug(`Данные для проверки: ${dataCheckString}`);
      }

      return {
        isValid: isHashValid,
        error: !isHashValid ? "invalid_hash" : null,
      };
    } catch (error) {
      console.error("Ошибка при валидации данных Telegram:", error);
      return { isValid: false, error: "validation_error" };
    }
  }

  async handleTelegramCallback(req, res) {
    try {
      console.log("Получен запрос на авторизацию через Telegram (GET)");

      // Обработка данных, отправленных как query параметры
      const telegramData = {
        id: req.query.id,
        first_name: req.query.first_name,
        last_name: req.query.last_name,
        username: req.query.username,
        photo_url: req.query.photo_url,
        auth_date: req.query.auth_date,
        hash: req.query.hash,
      };

      console.log("Данные для валидации:", { ...telegramData, hash: "***" });

      const validation = this.validateTelegramData(telegramData);

      if (!validation.isValid) {
        console.error(`Ошибка валидации: ${validation.error}`);
        return res.redirect(`/login?error=${validation.error}`);
      }

      // После успешной валидации сохраняем данные пользователя в сессии
      req.session.user = {
        id: telegramData.id,
        first_name: telegramData.first_name,
        last_name: telegramData.last_name,
        username: telegramData.username,
        photo_url: telegramData.photo_url,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.redirect("/login?error=session_error");
        }

        console.log("Пользователь успешно авторизован:", telegramData.id);
        res.redirect("/profile");
      });
    } catch (error) {
      console.error("Ошибка авторизации через Telegram:", error);
      res.redirect("/login?error=auth_failed");
    }
  }

  async handleTelegramCallbackPost(req, res) {
    try {
      console.log("Получен запрос на авторизацию через Telegram (POST)");

      // Обработка данных, отправленных как тело JSON
      const telegramData = {
        id: req.body.id,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        username: req.body.username,
        photo_url: req.body.photo_url,
        auth_date: req.body.auth_date,
        hash: req.body.hash,
      };

      console.log("Данные для валидации:", { ...telegramData, hash: "***" });

      const validation = this.validateTelegramData(telegramData);

      if (!validation.isValid) {
        console.error(`Ошибка валидации: ${validation.error}`);
        return res.status(403).json({ error: validation.error });
      }

      // После успешной валидации сохраняем данные пользователя в сессии
      req.session.user = {
        id: telegramData.id,
        first_name: telegramData.first_name,
        last_name: telegramData.last_name,
        username: telegramData.username,
        photo_url: telegramData.photo_url,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.status(500).json({ error: "session_error" });
        }

        console.log(
          "Пользователь успешно авторизован (POST):",
          telegramData.id
        );
        res.status(200).json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      console.error("Ошибка авторизации через Telegram (POST):", error);
      res.status(500).json({ error: "auth_failed" });
    }
  }
}
