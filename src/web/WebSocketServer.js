import { WebSocketServer } from "ws";
import { getMessageCount } from "../utils/messageCounter.js";
import logger from "../utils/logger.js";

export class WebSocketService {
  constructor(
    server,
    path = "/wss",
    { catService, enablePolling = false } = {}
  ) {
    this.catService = catService;
    // WebSocket server with basic limits
    this.wss = new WebSocketServer({
      server,
      path,
      // Max payload 1MB
      maxPayload: 1024 * 1024,
      // Origin verification hook (configure allowlist in production)
      verifyClient: () => true,
    });

    this.clientIPs = new Map(); // track connections per IP
    this.uptimeDateObject = new Date();
    this.leaderboardHash = ""; // leaderboard change fingerprint
    this.intervals = [];
    this.setupConnectionHandler();
    this.startBroadcasting();
    if (enablePolling) {
      this.startLeaderboardTracking();
    }
  }

  // Periodic leaderboard tracking
  async startLeaderboardTracking() {
    // Initialize baseline hash
    await this.updateLeaderboardHash();

    // Проверка изменения каждые 10 секунд
    const iv = setInterval(async () => {
      const changed = await this.updateLeaderboardHash();
      if (changed) this.broadcastData({ leaderboardChanged: true });
    }, 10000);
    this.intervals.push(iv);
  }

  // Обновляет хеш рейтинга и возвращает true, если он изменился
  async updateLeaderboardHash() {
    try {
      const leaderboard = await this.catService.getLeaderboard();
      // naive hash of leaderboard items
      const newHash = JSON.stringify(
        leaderboard.map((item) => `${item.id}-${item.count}`)
      );

      if (newHash !== this.leaderboardHash) {
        this.leaderboardHash = newHash;
        logger.debug("Leaderboard data changed, notifying clients");
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ err: error }, "Error updating leaderboard hash");
      return false;
    }
  }

  setupConnectionHandler() {
    this.wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress;
      logger.info({ ip }, "Client connected");

      // Per-IP connection limit
      if (!this.clientIPs.has(ip)) {
        this.clientIPs.set(ip, 1);
      } else {
        const count = this.clientIPs.get(ip) + 1;
        if (count > 5) {
          logger.warn({ ip }, "Too many connections from IP");
          ws.close(1008, "Too many connections");
          return;
        }
        this.clientIPs.set(ip, count);
      }

      // Initial state and leaderboard refresh hint
      ws.send(
        JSON.stringify({
          ...this.getStateData(),
          leaderboardChanged: true,
        })
      );

      // Per-client message rate limit
      let messageCount = 0;
      const messageInterval = setInterval(() => {
        messageCount = 0;
      }, 5000);
      this.intervals.push(messageInterval);

      // heartbeat ping/pong
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message) => {
        messageCount++;
        if (messageCount > 10) {
          ws.close(1008, "Message flood");
          clearInterval(messageInterval);
          return;
        }
      });

      const interval = setInterval(() => this.sendDataToClient(ws), 1000);
      this.intervals.push(interval);

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

        logger.info({ ip }, `Client disconnected`);
      });
    });

    // Global ping/pong to terminate dead connections
    const pingInterval = setInterval(() => {
      this.wss.clients.forEach((client) => {
        if (client.isAlive === false) return client.terminate();
        client.isAlive = false;
        try {
          client.ping();
        } catch (e) {
          logger.warn({ err: e }, "Failed to ping client");
        }
      });
    }, 30000);
    this.intervals.push(pingInterval);
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
    const iv = setInterval(() => this.broadcastData(), 1000);
    this.intervals.push(iv);
  }

  async close() {
    this.intervals.forEach((iv) => clearInterval(iv));
    this.intervals = [];
    await new Promise((resolve) => this.wss.close(() => resolve()));
    logger.info("WebSocket server stopped");
  }
}
