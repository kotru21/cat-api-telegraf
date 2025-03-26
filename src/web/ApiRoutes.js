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

  // маршрут для поиска котов по характеристикам (при клике на характеристику из catdetails)
  router.get("/similar", async (req, res) => {
    try {
      const { feature, value } = req.query;

      if (!feature || !value) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const cats = await catService.getCatsByFeature(feature, value);
      res.json(cats);
    } catch (err) {
      console.error("Error fetching similar cats:", err);
      res.status(500).json({ error: "Failed to fetch similar cats" });
    }
  });

  app.use("/api", router);
}
