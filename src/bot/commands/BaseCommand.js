import { Composer } from "telegraf";

export class BaseCommand {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.composer = new Composer();
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
