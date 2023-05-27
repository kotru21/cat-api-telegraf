import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
dotenv.config();
//command imports
import Fact from "./commands/Fact.js";
import Menu from "./commands/Menu.js";
import MessageLike from "./util/MessageLike.js";
import rateLimit from "telegraf-ratelimit";

//setup database
var db = new sqlite3.Database("./main.db");
db.run("CREATE TABLE IF NOT EXISTS msg (id TEXT PRIMARY KEY , count INTEGER)");

// Set limit to 1 message per 2 seconds
const limitConfig = {
  window: 2000,
  limit: 1,
  onLimitExceeded: (ctx, next) => ctx.reply("Не спамь"),
};

const apiKey = process.env.API_KEY;
const bot = new Telegraf(apiKey);
bot.use(rateLimit(limitConfig));
bot.use(Fact, Menu, MessageLike);
bot.start((ctx) => ctx.reply("Крч, я написал это на Node за 1 ночь, да. Чекк /menu"));

// bot.action("btn-2", (ctx) => {
//   console.log(ctx);
// });

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
