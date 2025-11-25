import { Router, Request, Response } from 'express';
import { AuthService, TelegramAuthData } from '../../services/AuthService.js';

export function setupAuthRoutes(router: Router, { authService }: { authService: AuthService }) {
  router.post('/auth/telegram', (req: Request, res: Response) => {
    try {
      // Извлекаем поля из тела запроса, отправленного Telegram Login Widget
      const { id, first_name, username, photo_url, auth_date, hash } = req.body as TelegramAuthData;

      // Валидация подписи hash согласно Bot API
      const validation = authService.validateTelegramData({
        id,
        first_name,
        username,
        photo_url,
        auth_date,
        hash,
      });

      if (!validation.isValid) {
        res.status(401).json({ error: validation.error || 'Invalid authentication data' });
        return;
      }

      // Сохраняем пользователя в сессии
      req.session.user = {
        id,
        first_name,
        username,
        photo_url,
      };

      // Принудительно сохраняем сессию и отвечаем клиенту
      req.session.save((err: Error | null) => {
        if (err) {
          res.status(500).json({ error: 'Session save failed' });
          return;
        }
        res.json({ success: true, redirect: '/profile' });
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });
}
