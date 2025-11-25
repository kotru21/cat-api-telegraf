import { Router, Request, Response } from 'express';

export function setupAuthRoutes(router: Router) {
  router.post('/auth/telegram', (req: Request, res: Response) => {
    try {
      // Извлекаем поля из тела запроса, отправленного Telegram Login Widget
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: валидация подписи hash
      const { id, first_name, username, photo_url, auth_date: _auth_date, hash: _hash } = req.body;

      // TODO: валидация подписи hash согласно Bot API (см. AuthController.validateTelegramData)

      // Сохраняем пользователя в сессии
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- express-session types are not augmented
      (req.session as any).user = {
        id,
        first_name,
        username,
        photo_url,
      };

      // Принудительно сохраняем сессию и отвечаем клиенту
      req.session.save((err: Error | null) => {
        if (err) {
          return res.status(500).json({ error: 'Session save failed' });
        }
        return res.json({ success: true, redirect: '/profile' });
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });
}
