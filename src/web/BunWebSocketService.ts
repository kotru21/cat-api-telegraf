import type { Server, ServerWebSocket } from 'bun';
import { getMessageCount } from '../utils/messageCounter.js';
import logger from '../utils/logger.js';
import { LeaderboardService } from '../services/LeaderboardService.js';

/**
 * WebSocket client data attached to each connection
 */
interface WebSocketClientData {
  ip: string;
  messageCount: number;
  lastMessageReset: number;
}

/**
 * State data sent to clients
 */
interface StateData {
  messageCount: number;
  uptimeDateObject: Date;
  leaderboardChanged?: boolean;
}

/**
 * Native Bun WebSocket service
 * Replaces the ws library with Bun's built-in WebSocket support
 */
export class BunWebSocketService {
  private leaderboardService: LeaderboardService;
  private clientIPs: Map<string, number> = new Map();
  private uptimeDateObject: Date;
  private leaderboardHash: string = '';
  private intervals: Timer[] = [];
  private server: Server<WebSocketClientData> | null = null;

  // Configuration
  private readonly MAX_CONNECTIONS_PER_IP = 5;
  private readonly MESSAGE_RATE_LIMIT = 10;
  private readonly MESSAGE_RATE_WINDOW_MS = 5000;
  private readonly BROADCAST_INTERVAL_MS = 1000;
  private readonly LEADERBOARD_CHECK_INTERVAL_MS = 10000;
  private readonly PING_INTERVAL_MS = 30000;

  constructor({
    leaderboardService,
    enablePolling = false,
  }: {
    leaderboardService: LeaderboardService;
    enablePolling?: boolean;
  }) {
    this.leaderboardService = leaderboardService;
    this.uptimeDateObject = new Date();

    if (enablePolling) {
      this.startLeaderboardTracking();
    }
  }

  /**
   * Attaches WebSocket handlers to an existing Bun server
   */
  getWebSocketHandlers() {
    return {
      maxPayloadLength: 1024 * 1024, // 1MB
      idleTimeout: 120,
      sendPings: true,

      open: (ws: ServerWebSocket<WebSocketClientData>) => {
        const ip = ws.data.ip;
        logger.info({ ip }, 'WebSocket client connected');

        // Check per-IP connection limit
        const currentCount = this.clientIPs.get(ip) || 0;
        if (currentCount >= this.MAX_CONNECTIONS_PER_IP) {
          logger.warn({ ip }, 'Too many WebSocket connections from IP');
          ws.close(1008, 'Too many connections');
          return;
        }
        this.clientIPs.set(ip, currentCount + 1);

        // Send initial state
        this.sendToClient(ws, { leaderboardChanged: true });
      },

      message: (ws: ServerWebSocket<WebSocketClientData>, message: string | Buffer) => {
        const now = Date.now();

        // Rate limiting per client
        if (now - ws.data.lastMessageReset > this.MESSAGE_RATE_WINDOW_MS) {
          ws.data.messageCount = 0;
          ws.data.lastMessageReset = now;
        }

        ws.data.messageCount++;
        if (ws.data.messageCount > this.MESSAGE_RATE_LIMIT) {
          logger.warn({ ip: ws.data.ip }, 'WebSocket message flood detected');
          ws.close(1008, 'Message flood');
          return;
        }

        // Handle message if needed (currently just logging)
        logger.debug(
          { ip: ws.data.ip, message: typeof message === 'string' ? message : '[binary]' },
          'WebSocket message received',
        );
      },

      close: (ws: ServerWebSocket<WebSocketClientData>, code: number, reason: string) => {
        const ip = ws.data.ip;

        // Decrease connection count for IP
        const count = (this.clientIPs.get(ip) || 1) - 1;
        if (count <= 0) {
          this.clientIPs.delete(ip);
        } else {
          this.clientIPs.set(ip, count);
        }

        logger.info({ ip, code, reason }, 'WebSocket client disconnected');
      },

      error: (ws: ServerWebSocket<WebSocketClientData>, error: Error) => {
        logger.error({ ip: ws.data.ip, error }, 'WebSocket error');
      },
    };
  }

  /**
   * Creates initial client data for WebSocket upgrade
   */
  createClientData(ip: string): WebSocketClientData {
    return {
      ip,
      messageCount: 0,
      lastMessageReset: Date.now(),
    };
  }

  /**
   * Starts periodic state broadcasting
   */
  startBroadcasting(server: Server<WebSocketClientData>) {
    this.server = server;

    const broadcastInterval = setInterval(() => {
      this.broadcast();
    }, this.BROADCAST_INTERVAL_MS);

    this.intervals.push(broadcastInterval);
  }

  /**
   * Periodic leaderboard tracking
   */
  async startLeaderboardTracking() {
    await this.updateLeaderboardHash();

    const interval = setInterval(async () => {
      const changed = await this.updateLeaderboardHash();
      if (changed) {
        this.broadcast({ leaderboardChanged: true });
      }
    }, this.LEADERBOARD_CHECK_INTERVAL_MS);

    this.intervals.push(interval);
  }

  /**
   * Updates leaderboard hash and returns true if changed
   */
  async updateLeaderboardHash(): Promise<boolean> {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard();
      const newHash = JSON.stringify(leaderboard.map((item) => `${item.id}-${item.count}`));

      if (newHash !== this.leaderboardHash) {
        this.leaderboardHash = newHash;
        logger.debug('Leaderboard data changed, notifying clients');
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ err: error }, 'Error updating leaderboard hash');
      return false;
    }
  }

  /**
   * Gets current state data
   */
  private getStateData(): StateData {
    return {
      messageCount: getMessageCount(),
      uptimeDateObject: this.uptimeDateObject,
    };
  }

  /**
   * Sends data to a single client
   */
  private sendToClient(
    ws: ServerWebSocket<WebSocketClientData>,
    additionalData: Record<string, unknown> = {},
  ) {
    try {
      ws.send(
        JSON.stringify({
          ...this.getStateData(),
          ...additionalData,
        }),
      );
    } catch (error) {
      logger.warn({ error }, 'Failed to send to WebSocket client');
    }
  }

  /**
   * Broadcasts data to all connected clients
   */
  broadcast(additionalData: Record<string, unknown> = {}) {
    if (!this.server) return;

    const data = JSON.stringify({
      ...this.getStateData(),
      ...additionalData,
    });

    // Bun's server.publish for efficient broadcasting
    this.server.publish('broadcast', data);
  }

  /**
   * Subscribes a client to the broadcast channel
   */
  subscribeClient(ws: ServerWebSocket<WebSocketClientData>) {
    ws.subscribe('broadcast');
  }

  /**
   * Cleanup
   */
  async close() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
    this.server = null;
    logger.info('Bun WebSocket service stopped');
  }
}
