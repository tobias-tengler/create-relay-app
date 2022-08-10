import { findFileInDirectory } from "../helpers.js";
import { TaskBase } from "../TaskBase.js";
import { CodeLanguage, ToolChain } from "../types.js";

export class AddRelayPluginConfigurationTask extends TaskBase {
  constructor(
    private workingDirectory: string,
    private toolChain: ToolChain,
    private language: CodeLanguage
  ) {
    super();
  }

  async run(): Promise<void> {
    switch (this.toolChain) {
      case "Vite":
        await this.configureVite();
        break;
      default:
        throw new Error("Unsupported toolchain");
    }
  }

  private async configureVite() {
    const configFilename =
      "vite.config" + (this.language === "Typescript" ? ".ts" : ".js");

    const configFilepath = await findFileInDirectory(
      this.workingDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(
        `Could not find ${configFilename} in ${this.workingDirectory}`
      );
    }

    // todo: parse config and modify
  }
}
