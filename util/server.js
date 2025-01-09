// server.js
import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import config from "../config.js";

const app = express();
app.use(cors());
app.options("*", cors());
const port = config.apiPort;

// Подключение к базе данных SQLite
const db = new sqlite3.Database("./main.db", (err) => {
  if (err) {
    console.error("Error connecting to SQLite:", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// API для получения таблицы лидеров
app.get("/api/leaderboard", (req, res) => {
  const query = `SELECT id, count FROM msg ORDER BY count DESC LIMIT 10;`;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
      console.log(err);
    } else {
      res.json(rows);
    }
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`API server is running at http://localhost:${port}`);
});

export default db;
