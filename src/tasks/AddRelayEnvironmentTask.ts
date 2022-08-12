import path from "path";
import { VITE_MAIN_FILE_NO_EXT, VITE_SRC_DIR } from "../consts.js";
import { findFileInDirectory } from "../helpers.js";
import { TaskBase } from "../TaskBase.js";
import { ToolChain, CodeLanguage } from "../types.js";

export class AddRelayEnvironmentTask extends TaskBase {
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
      // todo: implement CRA and Next.js
      default:
        throw new Error("Unsupported toolchain");
    }
  }

  async configureVite() {
    const relativeMainFilepath =
      VITE_MAIN_FILE_NO_EXT +
      (this.language === "Typescript" ? ".tsx" : ".jsx");

    const searchDirectory = path.dirname(
      path.join(this.workingDirectory, relativeMainFilepath)
    );

    const mainFilename = path.basename(relativeMainFilepath);

    const mainFilePath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilePath) {
      throw new Error(`${relativeMainFilepath} not found`);
    }

    // todo: import environment and wrap jsx in render(...) with it.
  }
}
