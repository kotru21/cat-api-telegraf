import { EventEmitter } from 'events';

// Глобальная шина событий приложения (не привязана к слою данных)
export const AppEvents = new EventEmitter();

// Ограничиваем количество listeners для предотвращения memory leak
AppEvents.setMaxListeners(20);

// Доменные события
export const EVENTS = {
  LEADERBOARD_CHANGED: 'leaderboardChanged',
};

export default AppEvents;
