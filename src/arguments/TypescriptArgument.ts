import { Command } from "commander";
import { ArgumentBase } from "./ArgumentBase.js";

export class TypescriptArgument extends ArgumentBase<"typescript"> {
  public name = "typescript" as const;

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags();

    command.option(flags, "use Typescript");
  }

  promptForValue(): Promise<boolean> {
    return this.showInquirerPrompt({
      message: "Does your project use Typescript",
      type: "confirm",
    });
  }

  async getDefaultValue(): Promise<boolean> {
    // const tsconfigFile = await findFileInDirectory(
    //   projectRootDirectory,
    //   TS_CONFIG_FILE
    // );

    // if (!!tsconfigFile) {
    //   return true;
    // }

    // const typescriptInstalled = await isNpmPackageInstalled(
    //   manager,
    //   projectRootDirectory,
    //   TYPESCRIPT_PACKAGE
    // );

    // if (typescriptInstalled) {
    //   return true;
    // }

    return false;
  }
}
