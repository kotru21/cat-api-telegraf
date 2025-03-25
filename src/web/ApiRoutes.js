import express from "express";
import catService from "../services/CatService.js";

export function setupApiRoutes(app) {
  const router = express.Router();

  router.get("/cat/:id", async (req, res) => {
    try {
      const catData = await catService.getCatById(req.params.id);
      if (!catData) return res.status(404).json({ error: "Cat not found" });
      res.json(catData);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch cat data" });
    }
  });

  router.get("/leaderboard", async (req, res) => {
    try {
      const rows = await catService.getLeaderboard();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.use("/api", router);
}
