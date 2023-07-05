import { getMessageCount } from "../bot.js";
import { WebSocketServer } from "ws";

export default function websocket(websocketPort) {
  let messageCount = getMessageCount();

  let uptimeDateObject = new Date();
  const wss = new WebSocketServer({
    port: websocketPort,
    path: "/websocket", // Specify the path for WebSocket requests. Change the websocket server adress in index.html if changing this.
  });

  wss.on("connection", (ws) => {
    // Send startup date and amount of messages to client every second
    const sendDataToClientEverySecond = () => {
      let data = {
        messageCount: messageCount,
        uptimeDateObject: uptimeDateObject,
      };
      let dataJson = JSON.stringify(data);
      ws.send(dataJson);
    };
    setInterval(sendDataToClientEverySecond, 1000);
  });
}
