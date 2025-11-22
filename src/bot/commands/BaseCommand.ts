import { Composer } from "telegraf";
import { AwilixContainer } from "awilix";
import logger from "../../utils/logger.js";

export class BaseCommand {
  protected name: string;
  protected description: string;
  protected composer: Composer<any>;
  protected container: AwilixContainer | null;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.composer = new Composer();
    this.container = null;
  }

  setContainer(container: AwilixContainer) {
    this.container = container;
  }

  createAppContext() {
    if (!this.container) {
      throw new Error(
        `Command ${this.name}: container is not set. Call setContainer() first.`
      );
    }
    return {
      likeService: this.container.resolve("likeService"),
      leaderboardService: this.container.resolve("leaderboardService"),
      catInfoService: this.container.resolve("catInfoService"),
    };
  }

  getCommandInfo() {
    return {
      command: this.name,
      description: this.description,
    };
  }

  register() {
    // Переопределяется в наследниках
    throw new Error("Метод должен быть переопределен в наследнике");
  }

  middleware() {
    return this.composer;
  }
}
