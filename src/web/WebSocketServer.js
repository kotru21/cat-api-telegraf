import { WebSocketServer } from "ws";
import { getMessageCount } from "../utils/messageCounter.js";
import catService from "../services/CatService.js";

export class WebSocketService {
  constructor(server, path = "/wss") {
    // Настройка WebSocket с ограничениями для безопасности
    this.wss = new WebSocketServer({
      server,
      path,
      // Ограничиваем размер сообщения до 1 МБ
      maxPayload: 1024 * 1024,
      // Проверка происхождения
      verifyClient: (info) => {
        // В продакшене можно добавить проверку origin
        // const origin = info.origin || info.req.headers.origin;
        // return allowedOrigins.includes(origin);
        return true;
      },
    });

    this.clientIPs = new Map(); // Для отслеживания подключений по IP
    this.uptimeDateObject = new Date();
    this.leaderboardHash = ""; // Хеш для отслеживания изменений рейтинга
    this.setupConnectionHandler();
    this.startBroadcasting();
    this.startLeaderboardTracking();
  }

  // Метод для отслеживания изменений рейтинга
  async startLeaderboardTracking() {
    // Инициализация начального значение хеша
    await this.updateLeaderboardHash();

    // Проверка изменения каждые 10 секунд
    setInterval(async () => {
      const changed = await this.updateLeaderboardHash();
      if (changed) {
        // Если рейтинг изменился, то уведомление всех клиентов
        this.broadcastData({ leaderboardChanged: true });
      }
    }, 10000);
  }

  // Обновляет хеш рейтинга и возвращает true, если он изменился
  async updateLeaderboardHash() {
    try {
      const leaderboard = await catService.getLeaderboard();
      // простой хеш на основе данных рейтинга
      const newHash = JSON.stringify(
        leaderboard.map((item) => `${item.id}-${item.count}`)
      );

      if (newHash !== this.leaderboardHash) {
        this.leaderboardHash = newHash;
        console.log("Leaderboard data changed, notifying clients");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating leaderboard hash:", error);
      return false;
    }
  }

  setupConnectionHandler() {
    this.wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress;
      console.log(`Client connected: ${ip}`);

      // Ограничение на количество соединений с одного IP
      if (!this.clientIPs.has(ip)) {
        this.clientIPs.set(ip, 1);
      } else {
        const count = this.clientIPs.get(ip) + 1;
        if (count > 5) {
          // Максимум 5 соединений с одного IP
          console.warn(`Too many connections from IP: ${ip}`);
          ws.close(1008, "Too many connections");
          return;
        }
        this.clientIPs.set(ip, count);
      }

      // Отправляем текущее состояние при подключении
      // и сразу запрашиваем начальную загрузку рейтинга
      ws.send(
        JSON.stringify({
          ...this.getStateData(),
          leaderboardChanged: true,
        })
      );

      // Ограничение на частоту сообщений
      let messageCount = 0;
      const messageInterval = setInterval(() => {
        messageCount = 0;
      }, 5000); // Сбрасываем счетчик каждые 5 секунд

      ws.on("message", (message) => {
        messageCount++;
        if (messageCount > 10) {
          // Максимум 10 сообщений за 5 секунд
          ws.close(1008, "Message flood");
          clearInterval(messageInterval);
          return;
        }

        // Обработка сообщений...
      });

      const interval = setInterval(() => this.sendDataToClient(ws), 1000);

      ws.on("close", () => {
        clearInterval(interval);
        clearInterval(messageInterval);

        // Уменьшаем счетчик соединений для IP
        if (this.clientIPs.has(ip)) {
          const count = this.clientIPs.get(ip) - 1;
          if (count <= 0) {
            this.clientIPs.delete(ip);
          } else {
            this.clientIPs.set(ip, count);
          }
        }

        console.log(`Client disconnected: ${ip}`);
      });
    });
  }

  getStateData() {
    return {
      messageCount: getMessageCount(),
      uptimeDateObject: this.uptimeDateObject,
    };
  }

  sendDataToClient(client, additionalData = {}) {
    if (client.readyState === client.OPEN) {
      client.send(
        JSON.stringify({
          ...this.getStateData(),
          ...additionalData,
        })
      );
    }
  }

  broadcastData(additionalData = {}) {
    this.wss.clients.forEach((client) =>
      this.sendDataToClient(client, additionalData)
    );
  }

  startBroadcasting() {
    setInterval(() => this.broadcastData(), 1000);
  }
}
