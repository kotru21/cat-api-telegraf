import express from "express";
import path from "path";
import config from "../config.js";
import fs from "fs";

export default function webServer(port) {
  const __dirname = path.resolve();
  const app = express();
  app.use("/static", express.static(path.join(__dirname, "public"))); // Media content location (will be located in http://localhost:${port}/static)

  app.get("/", function (req, res) {
    const filePath = path.join(__dirname, "util/index.html");

    // Read the index.html file with fs, to replace websocket port imported from config
    fs.readFile(filePath, "utf8", (err, htmlContent) => {
      if (err) {
        // Handle error if unable to read the file
        console.error("Error reading index.html: ", err);
        return res.status(500).send("Internal Server Error");
      }

      // Replace the placeholder with the desired value
      let modifiedContent = htmlContent.replace(
        "{{websocketPort}}",
        config.websocketServerPort
      );
      modifiedContent = modifiedContent.replace("{{apiPort}}", config.apiPort);
      // Send the modified HTML file
      res.send(modifiedContent);
    });
  });

  app.listen(port);
}
