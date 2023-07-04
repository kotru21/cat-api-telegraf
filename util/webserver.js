import express from "express";
import path from "path";
const __dirname = path.resolve();
const app = express();
const port = 4000;
// Media content location (will be located in http://localhost:${port}/static)
app.use("/static", express.static(path.join(__dirname, "public")));

export default function web() {
  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "util/index.html"));
  });

  app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
  });
}
