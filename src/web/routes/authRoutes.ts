import { Router, Request, Response } from "express";

export function setupAuthRoutes(router: Router) {
  router.post("/auth/telegram", (req: Request, res: Response) => {
    try {
      // Извлекаем поля из тела запроса, отправленного Telegram Login Widget
      const { id, first_name, username, photo_url, auth_date, hash } = req.body;

      // TODO: валидация подписи hash согласно Bot API (см. AuthController.validateTelegramData)

      // Сохраняем пользователя в сессии
      (req.session as any).user = {
        id,
        first_name,
        username,
        photo_url,
      };

      // Принудительно сохраняем сессию и отвечаем клиенту
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ error: "Session save failed" });
        }
        return res.json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });
}
