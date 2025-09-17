import crypto from "crypto";

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
  }

  validateTelegramData(data) {
    const { hash, ...otherData } = data;

    // Проверка hash
    const botToken = this.config.BOT_TOKEN;
    const secretKey = crypto.createHash("sha256").update(botToken).digest();

    const filteredData = {};
    for (const key in otherData) {
      if (otherData[key] !== undefined && otherData[key] !== null) {
        filteredData[key] = otherData[key];
      }
    }

    // Создаем строку для проверки в правильном формате
    const dataCheckString = Object.keys(filteredData)
      .sort()
      .map((key) => `${key}=${filteredData[key]}`)
      .join("\n");

    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const isHashValid = hmac.toLowerCase() === hash.toLowerCase();
    const isTimeValid =
      Date.now() / 1000 - parseInt(otherData.auth_date) <= 86400;

    // Детальные логи только в development
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("Received data:", data);
      // eslint-disable-next-line no-console
      console.log("Filtered data:", filteredData);
      // eslint-disable-next-line no-console
      console.log("Data check string:", dataCheckString);
      // eslint-disable-next-line no-console
      console.log("Computed HMAC:", hmac);
      // eslint-disable-next-line no-console
      console.log("Received Hash:", hash);
      // eslint-disable-next-line no-console
      console.log("Hash valid:", isHashValid);
    }

    return {
      isValid: isHashValid && isTimeValid,
      error: !isHashValid ? "invalid_hash" : !isTimeValid ? "expired" : null,
    };
  }

  async handleTelegramCallback(req, res) {
    try {
      const {
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      } = req.query;

      const validation = this.validateTelegramData({
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      });

      if (!validation.isValid) {
        return res.redirect(`/login?error=${validation.error}`);
      }

      // После успешной авторизации
      req.session.user = { id, first_name, last_name, username, photo_url };

      req.session.save((err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error("Ошибка сохранения сессии:", err);
          return res.redirect("/login?error=session_error");
        }

        res.redirect("/profile");
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Ошибка авторизации через Telegram:", error);
      res.redirect("/login?error=auth_failed");
    }
  }

  async handleTelegramCallbackPost(req, res) {
    try {
      const {
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      } = req.body;

      const validation = this.validateTelegramData({
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      });

      if (!validation.isValid) {
        return res.status(403).json({ error: validation.error });
      }

      // После успешной авторизации
      req.session.user = { id, first_name, last_name, username, photo_url };

      req.session.save((err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error("Ошибка сохранения сессии:", err);
          return res.status(500).json({ error: "session_error" });
        }

        res.status(200).json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Ошибка авторизации через Telegram:", error);
      res.status(500).json({ error: "auth_failed" });
    }
  }
}
