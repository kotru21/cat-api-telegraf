import session from "express-session";
import crypto from "crypto";

export function setupSession(app, config) {
  // Используем надежный секрет для сессий
  const sessionSecret =
    config.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        sameSite: "lax",
      },
      name: "cat_session", // Уникальное имя для cookie
    })
  );

  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      console.debug(
        `Сессия ${req.session.id} - пользователь:`,
        req.session.user ? req.session.user.id : "не авторизован"
      );
      next();
    });
  }
}
