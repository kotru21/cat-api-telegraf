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

    const dataCheckString = Object.keys(otherData)
      .sort()
      .map((key) => `${key}=${otherData[key]}`)
      .join("\n");

    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Проверка валидности хеша и времени запроса
    const isHashValid = hmac === hash;
    const isTimeValid =
      Date.now() / 1000 - parseInt(otherData.auth_date) <= 86400;

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
          console.error("Ошибка сохранения сессии:", err);
          return res.redirect("/login?error=session_error");
        }

        res.redirect("/profile");
      });
    } catch (error) {
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
          console.error("Ошибка сохранения сессии:", err);
          return res.status(500).json({ error: "session_error" });
        }

        res.status(200).json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      console.error("Ошибка авторизации через Telegram:", error);
      res.status(500).json({ error: "auth_failed" });
    }
  }
}
