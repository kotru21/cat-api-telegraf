import express from "express";
import cors from "cors";
import db from "./Database.js";

export default function API(port) {
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

  app.listen(port);
}
