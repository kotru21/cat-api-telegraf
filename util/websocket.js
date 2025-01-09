// websocket.js
import { getMessageCount } from "../bot.js";
import { WebSocketServer } from "ws";

export default function websocket(websocketPort) {
  let uptimeDateObject = new Date();
  const wss = new WebSocketServer({
    port: websocketPort,
    path: "/websocket",
  });

  // Broadcast function to send data to all connected clients
  const broadcastData = () => {
    let messageCount = getMessageCount(); // Get the latest message count
    let data = {
      messageCount: messageCount,
      uptimeDateObject: uptimeDateObject,
    };
    let dataJson = JSON.stringify(data);

    // Send data to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(dataJson);
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("Client connected");

    // Send initial data to the client
    let initialData = {
      messageCount: getMessageCount(),
      uptimeDateObject: uptimeDateObject,
    };
    ws.send(JSON.stringify(initialData));

    // Broadcast updated data whenever necessary
    const interval = setInterval(broadcastData, 1000);

    // Cleanup on client disconnect
    ws.on("close", () => {
      console.log("Client disconnected");
      clearInterval(interval);
    });
  });

  // Simulate real-time updates (replace this with actual event listeners)
  setInterval(() => {
    broadcastData(); // Call whenever message count changes
  }, 1000);
}
