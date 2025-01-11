import express from "express";
import path from "path";
import config from "../config.js";
import fs from "fs";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import db from "./database.js";
import { getMessageCount } from "./messageCounter.js";

export default function webServer(port) {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({
    server: server,
    path: "/ws", // Добавляем explicit путь
  });
  const __dirname = path.resolve();
  let uptimeDateObject = new Date();

  // WebSocket логика
  const broadcastData = () => {
    const data = {
      messageCount: getMessageCount(),
      uptimeDateObject: uptimeDateObject,
    };
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.send(
      JSON.stringify({
        messageCount: getMessageCount(),
        uptimeDateObject: uptimeDateObject,
      })
    );

    const interval = setInterval(broadcastData, 1000);
    ws.on("close", () => {
      clearInterval(interval);
      console.log("Client disconnected");
    });
  });

  setInterval(broadcastData, 1000);

  // Express Middleware
  app.use(cors());
  app.use(express.json());
  app.use("/static", express.static(path.join(__dirname, "public")));

  // API endpoints
  app.get("/api/cat/:id", async (req, res) => {
    try {
      const catData = await db.getCatById(req.params.id);
      if (!catData) return res.status(404).json({ error: "Cat not found" });
      res.json(catData);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch cat data" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const rows = await db.getLeaderboard();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // HTML routes
  app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "util/index.html");
    fs.readFile(filePath, "utf8", (err, html) => {
      if (err) return res.status(500).send("Internal Server Error");
      const modified = html
        .replace("{{websocketPort}}", port)
        .replace("{{apiPort}}", port);
      res.send(modified);
    });
  });

  app.get("/catDetails", (req, res) => {
    res.sendFile(path.join(__dirname, "util/catDetails.html"));
  });

  // Запуск сервера
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  return { server, wss };
}
