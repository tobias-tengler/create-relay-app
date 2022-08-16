import path from "path";
import { TaskBase } from "./TaskBase.js";
import { copyFile, createDirectory, doesExist, h } from "../utils/index.js";
import { ProjectContext } from "../ProjectContext.js";

export class GenerateRelayEnvironmentTask extends TaskBase {
  message: string = "Generate Relay environment";

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    await this.addRelayEnvironmentFile();
  }

  private async addRelayEnvironmentFile() {
    this.updateMessage(this.message + " " + h(this.context.relayEnvFile.rel));

    if (await doesExist(this.context.relayEnvFile.abs)) {
      this.skip("File exists");
      return;
    }

    const destDirectory = path.dirname(this.context.relayEnvFile.abs);

    let srcFile: string;

    if (this.context.args.typescript) {
      srcFile = "./assets/env_ts";
    } else {
      srcFile = "./assets/env";
    }

    const srcFilepath = path.join(
      this.context.env.ownPackageDirectory,
      srcFile
    );

    // todo: handle error
    createDirectory(destDirectory);

    // todo: handle error
    await copyFile(srcFilepath, this.context.relayEnvFile.abs);
  }
}
