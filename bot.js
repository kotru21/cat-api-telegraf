import { Telegraf } from "telegraf";
import sqlite3 from "sqlite3";
import rateLimit from "telegraf-ratelimit";
import config from "./config.js";

if (config.expressServer) {
  import("./util/webServer.js").then((module) => {
    const webServer = module.default;
    console.log(`Web Server is listening on ${config.expressServerPort}`);
    webServer(config.expressServerPort);
  });
}

if (config.expressServer) {
  import("./util/websocket.js").then((module) => {
    const websocket = module.default;
    console.log(`Websocket Server is listening on ${config.websocketServerPort}`);
    websocket(config.websocketServerPort);
  });
}

// Bot command imports
import Fact from "./commands/Fact.js";
import Menu from "./commands/Menu.js";
import messageLike from "./util/messageLike.js";

let messageCount = 0;

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

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
bot.use(rateLimit(limitConfig));
bot.use((ctx, next) => {
  messageCount++; // Update amount of bot sent messages after every bot's action
  next(); // Count the message and leave
});

// Init bot's commands
bot.use(Fact, Menu, messageLike);
bot.start((ctx) => ctx.reply("Крч, я написал это на Node за 1 ночь, да. Чекк /menu"));
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export function getMessageCount() {
  return messageCount;
}
