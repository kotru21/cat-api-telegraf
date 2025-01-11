import dotenv from "dotenv";
dotenv.config(); // Setup .env

export default {
  BOT_TOKEN: process.env.API_KEY,
  CAT_API_TOKEN: process.env.CATAPI_KEY,
  WebServer: true,
  expressServerPort: process.env.PORT || 5200,
  websocketServerPort: process.env.PORT || 5200,
  apiPort: process.env.PORT || 5200,
};
