import crypto from "crypto";
import { Express, Request, Response } from "express";
import logger from "../../utils/logger.js";

interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
  [key: string]: any;
}

export class AuthController {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  setupRoutes(app: Express) {
    app.get("/auth/telegram/callback", this.handleTelegramCallback.bind(this));
    app.post(
      "/auth/telegram/callback",
      this.handleTelegramCallbackPost.bind(this)
    );
  }

  validateTelegramData(data: TelegramAuthData) {
    const { hash, ...otherData } = data;

    // Проверка hash
    const botToken = this.config.BOT_TOKEN;
    const secretKey = crypto.createHash("sha256").update(botToken).digest();

    const filteredData: Record<string, any> = {};
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

  async handleTelegramCallback(req: Request, res: Response) {
    try {
      const {
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date,
        hash,
      } = req.query as unknown as TelegramAuthData;

      const startTs = Date.now();
      logger.info(
        {
          route: "GET /auth/telegram/callback",
          queryKeys: Object.keys(req.query),
          hasSession: !!req.session,
        },
        "Auth callback received"
      );

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
        logger.warn(
          { reason: validation.error },
          "Auth callback validation failed"
        );
        return res.redirect(`/login?error=${validation.error}`);
      }

      // После успешной авторизации
      (req.session as any).user = {
        id,
        first_name,
        last_name,
        username,
        photo_url,
      };

      // Обёртка с таймаутом чтобы не висеть 30s из-за store
      const savePromise = new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const timeoutMs = 5000;
      try {
        await Promise.race([
          savePromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("session_save_timeout")),
              timeoutMs
            )
          ),
        ]);
        logger.info(
          { elapsed: Date.now() - startTs },
          "Auth callback session saved"
        );
        return res.redirect("/profile");
      } catch (e: any) {
        logger.error({ err: e }, "Auth callback session save failed");
        return res.redirect(
          `/login?error=${
            e.message === "session_save_timeout"
              ? "session_timeout"
              : "session_error"
          }`
        );
      }
    } catch (error) {
      logger.error({ err: error }, "Auth callback fatal error");
      res.redirect("/login?error=auth_failed");
    }
  }

  async handleTelegramCallbackPost(req: Request, res: Response) {
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
      const startTs = Date.now();
      logger.info(
        {
          route: "POST /auth/telegram/callback",
          bodyKeys: Object.keys(req.body || {}),
          hasSession: !!req.session,
        },
        "Auth callback POST received"
      );

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
        logger.warn(
          { reason: validation.error },
          "Auth callback POST validation failed"
        );
        return res.status(403).json({ error: validation.error });
      }

      // После успешной авторизации
      (req.session as any).user = {
        id,
        first_name,
        last_name,
        username,
        photo_url,
      };

      const savePromise = new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const timeoutMs = 5000;
      try {
        await Promise.race([
          savePromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("session_save_timeout")),
              timeoutMs
            )
          ),
        ]);
        logger.info(
          { elapsed: Date.now() - startTs },
          "Auth callback POST session saved"
        );
        return res.status(200).json({ success: true, redirect: "/profile" });
      } catch (e: any) {
        logger.error({ err: e }, "Auth callback POST session save failed");
        return res.status(500).json({
          error:
            e.message === "session_save_timeout"
              ? "session_timeout"
              : "session_error",
        });
      }
    } catch (error) {
      logger.error({ err: error }, "Auth callback POST fatal error");
      res.status(500).json({ error: "auth_failed" });
    }
  }
}
