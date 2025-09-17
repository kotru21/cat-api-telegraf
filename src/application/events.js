import { EventEmitter } from "events";

// Глобальная шина событий приложения (не привязана к слою данных)
export const AppEvents = new EventEmitter();

// Доменные события
export const EVENTS = {
  LEADERBOARD_CHANGED: "leaderboardChanged",
};

export default AppEvents;
