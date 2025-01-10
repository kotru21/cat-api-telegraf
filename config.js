import dotenv from "dotenv";
dotenv.config(); // Setup .env

export default {
  BOT_TOKEN: process.env.API_KEY,
  CAT_API_TOKEN: process.env.CATAPI_KEY,
  WebServer: true, // Run web server and websocket server
  expressServerPort: 5200, // Port on what web server will work (f.e. localhost:port)
  websocketServerPort: 200, // Port on what websocket server will work (f.e. localhost:port/websocket)
  apiPort: 300,
};
