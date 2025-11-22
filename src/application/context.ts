// Контейнер зависимостей для use-cases.
// ВАЖНО: контейнер устанавливается один раз приложением (index.js)
// через setAppContainer и далее только используется. Новые контейнеры
// внутри этого модуля НЕ создаются, чтобы избежать рассинхронизации синглтонов.

import { AwilixContainer } from 'awilix';
import logger from '../utils/logger.js';
import { AppError, ValidationError, NotFoundError } from './errors.js';

let appContainer: AwilixContainer | null = null;

export function setAppContainer(container: AwilixContainer) {
  appContainer = container;
}

export function getContainer() {
  if (!appContainer) {
    throw new Error('App DI container is not set. Call setAppContainer(container) during startup.');
  }
  return appContainer;
}

export function createAppContext(overrides: any = {}) {
  const c = getContainer();
  return {
    catInfoService: overrides.catInfoService || c.resolve('catInfoService'),
    likeService: overrides.likeService || c.resolve('likeService'),
    leaderboardService: overrides.leaderboardService || c.resolve('leaderboardService'),
  };
}

export default createAppContext;
