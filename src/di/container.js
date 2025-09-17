import { createContainer, asValue, asClass, InjectionMode } from "awilix";
import config from "../config/index.js";

// Services & repositories (классы)
import { CatService } from "../services/CatService.js";
import { LikeService } from "../services/LikeService.js";
import { LeaderboardService } from "../services/LeaderboardService.js";
import { CatInfoService } from "../services/CatInfoService.js";
import { CatRepository } from "../database/CatRepository.js";
import { LikesRepository } from "../database/LikesRepository.js";
import { CatApiClient } from "../api/CatApiClient.js";
import getPrisma from "../database/prisma/PrismaClient.js";

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
    catService: asClass(CatService).singleton(),
  });

  return container;
}

export default buildContainer;
