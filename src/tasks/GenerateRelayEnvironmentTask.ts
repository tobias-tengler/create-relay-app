import path from "path";
import fs from "fs-extra";
import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../types.js";

export class GenerateRelayEnvironmentTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    await this.addRelayEnvironmentFile();
  }

  private async addRelayEnvironmentFile() {
    const destDirectory = path.dirname(this.settings.relayEnvFilepath);

    let srcFile: string;

    if (this.settings.typescript) {
      srcFile = "./assets/env_ts";
    } else {
      srcFile = "./assets/env";
    }

    const srcFilepath = path.join(this.settings.ownPackageDirectory, srcFile);

    // todo: handle error
    fs.mkdirSync(destDirectory, { recursive: true });

    // todo: handle error
    await fs.copyFile(srcFilepath, this.settings.relayEnvFilepath);
  }
}
