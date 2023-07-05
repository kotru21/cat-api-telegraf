import express from "express";
import path from "path";

export default function webServer(port) {
  const __dirname = path.resolve();
  const app = express();
  app.use("/static", express.static(path.join(__dirname, "public"))); // Media content location (will be located in http://localhost:${port}/static)
  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "util/index.html"));
  });

  app.listen(port);
}
