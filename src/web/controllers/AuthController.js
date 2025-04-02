export class AuthController {
  authenticateTelegram = (req, res) => {
    try {
      // Проверка данных от Telegram
      const { id, first_name, username, photo_url, auth_date, hash } = req.body;

      // Логика проверки подлинности данных здесь...

      // Сохранение пользователя в сессии
      req.session.user = {
        id,
        first_name,
        username,
        photo_url,
      };

      // Принудительное сохранение сессии
      req.session.save((err) => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.status(500).json({ error: "Session save failed" });
        }
        console.log("Пользователь успешно авторизован:", id, username);
        return res.json({ success: true, redirect: "/profile" });
      });
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      res.status(400).json({ error: error.message });
    }
  };
}
