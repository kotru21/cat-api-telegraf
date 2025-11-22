import { Composer } from "telegraf";

export abstract class BaseCommand {
  protected name: string;
  protected description: string;
  protected composer: Composer<any>;

  constructor(name: string, description: string) {
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

  abstract register(): void;

  middleware() {
    return this.composer;
  }
}
