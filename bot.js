import { Telegraf } from "telegraf";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import rateLimit from "telegraf-ratelimit";
import web from "./util/webserver.js";

// bot command imports
import Fact from "./commands/Fact.js";
import Menu from "./commands/Menu.js";
import messageLike from "./util/messageLike.js";

web(); // Enable webserver (index.html)
dotenv.config(); // Setup .env

const websocketPort = 5000;
let messageCount = 0;

let uptimeDateObject = new Date();
const wss = new WebSocketServer({
  port: websocketPort,
  path: "/websocket", // Specify the path for WebSocket requests
});

wss.on("connection", (ws) => {
  // Send startup date and amount of messages to client every second
  setInterval(sendToClientDataEverySecond, 1000);
  function sendToClientDataEverySecond() {
    let data = {
      messageCount: messageCount,
      uptimeDateObject: uptimeDateObject,
    };
    let dataJson = JSON.stringify(data);
    ws.send(dataJson);
  }
});

console.log(`websocket server started on port ${websocketPort}`);

// Setup database
var db = new sqlite3.Database("./main.db");
db.serialize(function () {
  db.run("CREATE TABLE IF NOT EXISTS msg (id TEXT PRIMARY KEY , count INTEGER)");
});

// Set limit to 1 message per 2 seconds
const limitConfig = {
  window: 2000,
  limit: 1,
  onLimitExceeded: (ctx, next) => ctx.reply("Не спамь"),
};

const apiKey = process.env.API_KEY;
const bot = new Telegraf(apiKey);

bot.use(rateLimit(limitConfig));
bot.use((ctx, next) => {
  messageCount++; // Update amount of bot sent messages after every bot's action
  console.log(messageCount);
  next(); // Count the message and leave
});

// Init bot's commands
bot.use(Fact, Menu, messageLike);
bot.start((ctx) => ctx.reply("Крч, я написал это на Node за 1 ночь, да. Чекк /menu"));
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
