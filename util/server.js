import express from "express";
import path from "path";
import config from "../config.js";
import fs from "fs";
import cors from "cors";
import db from "./Database.js";

export default function webServer(port) {
  const __dirname = path.resolve();
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use("/static", express.static(path.join(__dirname, "public")));

  // API endpoints
  app.get("/api/cat/:id", async (req, res) => {
    try {
      const catId = req.params.id;
      const catData = await db.getCatById(catId);

      if (!catData) {
        return res.status(404).json({ error: "Cat not found" });
      }

      res.json(catData);
    } catch (err) {
      console.error("API Error:", err);
      res.status(500).json({ error: "Failed to fetch cat data" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const rows = await db.getLeaderboard();
      res.json(rows);
    } catch (err) {
      console.error("API Error:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // HTML routes
  app.get("/", function (req, res) {
    const filePath = path.join(__dirname, "util/index.html");
    fs.readFile(filePath, "utf8", (err, htmlContent) => {
      if (err) {
        console.error("Error reading index.html:", err);
        return res.status(500).send("Internal Server Error");
      }
      let modifiedContent = htmlContent.replace(
        "{{websocketPort}}",
        config.websocketServerPort
      );
      modifiedContent = modifiedContent.replace("{{apiPort}}", port);
      res.send(modifiedContent);
    });
  });

  app.get("/catDetails", (req, res) => {
    res.sendFile(path.join(__dirname, "util/catDetails.html"));
  });

  app.listen(port, () => {
    console.log(`Web server and API running on port ${port}`);
  });
}
