import { createContainer, asValue, asClass, InjectionMode, AwilixContainer } from 'awilix';
import config from '../config/index.js';
import { Config } from '../config/types.js';
import { PrismaClient } from '@prisma/client';

// Services & repositories (классы)
import { LikeService } from '../services/LikeService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { CatInfoService } from '../services/CatInfoService.js';
import { AuthService } from '../services/AuthService.js';
import { CacheService } from '../services/CacheService.js';
import { CatRepository } from '../database/CatRepository.js';
import { LikesRepository } from '../database/LikesRepository.js';
import { CatApiClient } from '../api/CatApiClient.js';
import getPrisma from '../database/prisma/PrismaClient.js';

// Bot Commands
import { FactCommand } from '../bot/commands/FactCommand.js';
import { MenuCommand } from '../bot/commands/MenuCommand.js';
import { MyLikesCommand } from '../bot/commands/MyLikesCommand.js';
import { TopCommand } from '../bot/commands/TopCommand.js';
import { LikeAction } from '../bot/actions/LikeAction.js';
import { BotService } from '../bot/BotService.js';

// Web
import { WebServer } from '../web/WebServer.js';
import { AuthController } from '../web/controllers/AuthController.js';
import { ApiRouter } from '../web/ApiRoutes.js';

export interface Cradle {
  config: Config;
  prisma: PrismaClient;
  catApiClient: CatApiClient;
  cacheService: CacheService;
  catRepository: CatRepository;
  likesRepository: LikesRepository;
  likeService: LikeService;
  leaderboardService: LeaderboardService;
  catInfoService: CatInfoService;
  authService: AuthService;
  factCommand: FactCommand;
  menuCommand: MenuCommand;
  myLikesCommand: MyLikesCommand;
  topCommand: TopCommand;
  likeAction: LikeAction;
  commands: Array<FactCommand | MenuCommand | MyLikesCommand | TopCommand | LikeAction>;
  botService: BotService;
  webServer: WebServer;
  authController: AuthController;
  apiRouter: ApiRouter;
}

export function buildContainer(): AwilixContainer<Cradle> {
  // Используем PROXY, чтобы инжектить единый объект cradle и забирать из него зависимости
  const container = createContainer<Cradle>({ injectionMode: InjectionMode.PROXY });

  // Create cache service with config
  const cacheService = new CacheService({
    redisUrl: config.REDIS_URL,
    allowSelfSigned: config.REDIS_ALLOW_SELF_SIGNED,
    defaultTtl: 300,
    keyPrefix: 'catbot:',
  });

  container.register({
    config: asValue(config),
    prisma: asValue(getPrisma()),
    // Low-level deps: фиксируем инстанс, чтобы избежать автопередачи cradle
    catApiClient: asValue(new CatApiClient()),
    cacheService: asValue(cacheService),

    // Repositories как синглтоны
    catRepository: asClass(CatRepository).singleton(),
    likesRepository: asClass(LikesRepository).singleton(),

    // Services как синглтоны
    likeService: asClass(LikeService).singleton(),
    leaderboardService: asClass(LeaderboardService).singleton(),
    catInfoService: asClass(CatInfoService).singleton(),
    authService: asClass(AuthService).singleton(),

    // Bot Commands
    factCommand: asClass(FactCommand).singleton(),
    menuCommand: asClass(MenuCommand).singleton(),
    myLikesCommand: asClass(MyLikesCommand).singleton(),
    topCommand: asClass(TopCommand).singleton(),
    likeAction: asClass(LikeAction).singleton(),

    // Commands array for BotService
    commands: asValue([]),

    // Bot Service
    botService: asClass(BotService).singleton(),

    // Web
    webServer: asClass(WebServer).singleton(),
    authController: asClass(AuthController).singleton(),
    apiRouter: asClass(ApiRouter).singleton(),
  });

  // После регистрации всех зависимостей, заполняем массив commands
  const commandsList = [
    container.resolve('factCommand'),
    container.resolve('menuCommand'),
    container.resolve('myLikesCommand'),
    container.resolve('topCommand'),
    container.resolve('likeAction'),
  ];

  container.register({
    commands: asValue(commandsList),
  });

  return container;
}

export default buildContainer;
