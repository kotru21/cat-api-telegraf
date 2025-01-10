import { getMessageCount } from "./messageCounter.js";
import { WebSocketServer } from "ws";

export default function websocket(websocketPort) {
  let uptimeDateObject = new Date();
  const wss = new WebSocketServer({
    port: websocketPort,
    path: "/websocket",
  });

  const broadcastData = () => {
    let data = {
      messageCount: getMessageCount(),
      uptimeDateObject: uptimeDateObject,
    };
    let dataJson = JSON.stringify(data);

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(dataJson);
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("Client connected");

    let initialData = {
      messageCount: getMessageCount(),
      uptimeDateObject: uptimeDateObject,
    };
    ws.send(JSON.stringify(initialData));

    const interval = setInterval(broadcastData, 1000);

    ws.on("close", () => {
      console.log("Client disconnected");
      clearInterval(interval);
    });
  });

  setInterval(broadcastData, 1000);
}
