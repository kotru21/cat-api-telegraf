import session from "express-session";
import crypto from "crypto";

export function setupSession(app, config) {
  app.use(
    session({
      secret: config.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );
}
