import { WebSocketServer } from "ws";
import { getMessageCount } from "../utils/messageCounter.js";

export class WebSocketService {
  constructor(server, path = "/wss") {
    this.wss = new WebSocketServer({ server, path });
    this.uptimeDateObject = new Date();
    this.setupConnectionHandler();
    this.startBroadcasting();
  }

  setupConnectionHandler() {
    this.wss.on("connection", (ws) => {
      console.log("Client connected");
      ws.send(JSON.stringify(this.getStateData()));

      const interval = setInterval(() => this.sendDataToClient(ws), 1000);
      ws.on("close", () => {
        clearInterval(interval);
        console.log("Client disconnected");
      });
    });
  }

  getStateData() {
    return {
      messageCount: getMessageCount(),
      uptimeDateObject: this.uptimeDateObject,
    };
  }

  sendDataToClient(client) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(this.getStateData()));
    }
  }

  broadcastData() {
    this.wss.clients.forEach((client) => this.sendDataToClient(client));
  }

  startBroadcasting() {
    setInterval(() => this.broadcastData(), 1000);
  }
}
