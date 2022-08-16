import path from "path";
import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { copyFile, createDirectory, h } from "../utils/index.js";

export class GenerateRelayEnvironmentTask extends TaskBase {
  message: string = "Generate Relay environment";

  constructor(private settings: ProjectSettings) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    await this.addRelayEnvironmentFile();
  }

  private async addRelayEnvironmentFile() {
    this.updateMessage(this.message + " " + h(this.settings.relayEnvFile.rel));

    const destDirectory = path.dirname(this.settings.relayEnvFile.abs);

    let srcFile: string;

    if (this.settings.typescript) {
      srcFile = "./assets/env_ts";
    } else {
      srcFile = "./assets/env";
    }

    const srcFilepath = path.join(this.settings.ownPackageDirectory, srcFile);

    // todo: handle error
    createDirectory(destDirectory);

    // todo: handle error
    await copyFile(srcFilepath, this.settings.relayEnvFile.abs);
  }
}
