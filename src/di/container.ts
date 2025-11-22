import { createContainer, asValue, asClass, InjectionMode } from "awilix";
import config from "../config/index.js";

// Services & repositories (классы)
import { LikeService } from "../services/LikeService.js";
import { LeaderboardService } from "../services/LeaderboardService.js";
import { CatInfoService } from "../services/CatInfoService.js";
import { CatRepository } from "../database/CatRepository.js";
import { LikesRepository } from "../database/LikesRepository.js";
import { CatApiClient } from "../api/CatApiClient.js";
import getPrisma from "../database/prisma/PrismaClient.js";

// Bot Commands
import { FactCommand } from "../bot/commands/FactCommand.js";
import { MenuCommand } from "../bot/commands/MenuCommand.js";
import { MyLikesCommand } from "../bot/commands/MyLikesCommand.js";
import { TopCommand } from "../bot/commands/TopCommand.js";
import { LikeAction } from "../bot/actions/LikeAction.js";
import { BotService } from "../bot/BotService.js";

// Web
import { WebServer } from "../web/WebServer.js";
import { AuthController } from "../web/controllers/AuthController.js";
import { WebSocketService } from "../web/WebSocketServer.js";
import { ApiRouter } from "../web/ApiRoutes.js";

export function buildContainer() {
  // Используем PROXY, чтобы инжектить единый объект cradle и забирать из него зависимости
  const container = createContainer({ injectionMode: InjectionMode.PROXY });

  container.register({
    config: asValue(config),
    prisma: asValue(getPrisma()),
    // Low-level deps: фиксируем инстанс, чтобы избежать автопередачи cradle
    catApiClient: asValue(new CatApiClient()),

    // Repositories как синглтоны
    catRepository: asClass(CatRepository).singleton(),
    likesRepository: asClass(LikesRepository).singleton(),

    // Services как синглтоны
    likeService: asClass(LikeService).singleton(),
    leaderboardService: asClass(LeaderboardService).singleton(),
    catInfoService: asClass(CatInfoService).singleton(),

    // Bot Commands
    factCommand: asClass(FactCommand).singleton(),
    menuCommand: asClass(MenuCommand).singleton(),
    myLikesCommand: asClass(MyLikesCommand).singleton(),
    topCommand: asClass(TopCommand).singleton(),
    likeAction: asClass(LikeAction).singleton(),

    // Bot Service
    botService: asClass(BotService)
      .singleton()
      .inject(() => ({
        config,
        commands: [
          container.resolve("factCommand"),
          container.resolve("menuCommand"),
          container.resolve("myLikesCommand"),
          container.resolve("topCommand"),
          container.resolve("likeAction"),
        ],
      })),

    // Web
    authController: asClass(AuthController).singleton(),
    apiRouter: asClass(ApiRouter).singleton(),
    webServer: asClass(WebServer).singleton(),
  });

  return container;
}

export default buildContainer;
