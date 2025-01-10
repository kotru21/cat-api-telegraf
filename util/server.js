import express from "express";
import cors from "cors";
import config from "../config.js";
import db from "./database.js";

const app = express();
app.use(cors());
app.options("*", cors());

app.get("/api/leaderboard", async (req, res) => {
  try {
    const rows = await db.getLeaderboard();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
    console.error(err);
  }
});

app.listen(config.apiPort);
