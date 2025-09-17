import { Composer } from "telegraf";
import { executeUseCase } from "../../application/context.js";
import logger from "../../utils/logger.js";

export class BaseCommand {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.composer = new Composer();
    this.container = null;
  }

  setContainer(container) {
    this.container = container;
  }

  createAppContext() {
    if (!this.container) {
      throw new Error(
        `Command ${this.name}: container is not set. Call setContainer() first.`
      );
    }
    return {
      catService: this.container.resolve("catService"),
      likeService: this.container.resolve("likeService"),
      leaderboardService: this.container.resolve("leaderboardService"),
      catInfoService: this.container.resolve("catInfoService"),
    };
  }

  /**
   * Безопасное выполнение use-case с обработкой ошибок
   * @param {Function} useCaseFn - use-case функция
   * @param {Object} params - параметры для use-case
   * @param {Object} ctx - Telegraf context
   * @returns {Promise<any>} - результат выполнения
   */
  async executeUseCase(useCaseFn, params = {}, ctx = null) {
    const appCtx = this.createAppContext();
    const meta = {
      userId: ctx?.from?.id,
      username: ctx?.from?.username,
      command: this.name,
      chatId: ctx?.chat?.id,
    };

    try {
      return await executeUseCase(useCaseFn, appCtx, params, meta);
    } catch (error) {
      // Логирование уже происходит в executeUseCase
      throw error;
    }
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
