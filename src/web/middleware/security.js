import helmet from "helmet";
import cors from "cors";
import express from "express";

export function setupSecurity(app) {
  const helmetOpts = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "cdn.tailwindcss.com",
          "cdnjs.cloudflare.com",
          "telegram.org",
          "*.telegram.org",
          "t.me",
          "oauth.telegram.org",
          "placehold.co",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "cdn.tailwindcss.com",
          "cdnjs.cloudflare.com",
          "*.telegram.org",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "telegram.org",
          "*.telegram.org",
          "t.me",
          "placehold.co",
          "https://*",
        ],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "telegram.org",
          "*.telegram.org",
          "oauth.telegram.org",
        ],
        fontSrc: ["'self'", "cdnjs.cloudflare.com"],
        objectSrc: ["'none'"],
        frameSrc: [
          "'self'",
          "telegram.org",
          "*.telegram.org",
          "t.me",
          "oauth.telegram.org",
        ],
        formAction: [
          "'self'",
          "telegram.org",
          "*.telegram.org",
          "oauth.telegram.org",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: {
      policy: ["origin", "strict-origin-when-cross-origin"],
    },
    xFrameOptions: false,
    hsts: process.env.NODE_ENV === "production",
    xPoweredBy: false,
  };

  app.use(helmet(helmetOpts));

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json());
}
