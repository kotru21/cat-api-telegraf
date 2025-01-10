import express from "express";
import cors from "cors";
import db from "./Database.js";

export default function API(port) {
  const app = express();
  app.use(cors());
  app.options("*", cors());
  // leaderboard endpoint to fetch the leaderboard json data
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const rows = await db.getLeaderboard();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
      console.error(err);
    }
  });
  app.get("/api/cat/:id", async (req, res) => {
    try {
      const catId = req.params.id;
      const catData = await db.getCatById(catId);

      if (!catData) {
        return res.status(404).json({ error: "Cat not found" });
      }

      res.json(catData);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch cat data" });
      console.error(err);
    }
  });

  app.listen(port);
}
