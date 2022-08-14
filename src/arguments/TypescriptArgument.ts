import { Command } from "commander";
import { TS_CONFIG_FILE, TYPESCRIPT_PACKAGE } from "../consts.js";
import { CliArguments, EnvArguments } from "../types.js";
import { isNpmPackageInstalled, findFileInDirectory } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class TypescriptArgument extends ArgumentBase<"typescript"> {
  public name = "typescript" as const;

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags();

    command.option(flags, "use Typescript");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<boolean> {
    return this.showInquirerPrompt(
      {
        message: "Does your project use Typescript",
        type: "confirm",
      },
      existingArgs,
      env
    );
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<boolean> {
    const tsconfigFile = await findFileInDirectory(
      env.projectRootDirectory,
      TS_CONFIG_FILE
    );

    if (!!tsconfigFile) {
      return true;
    }

    const typescriptInstalled = await isNpmPackageInstalled(
      env.launcher,
      env.projectRootDirectory,
      TYPESCRIPT_PACKAGE
    );

    if (typescriptInstalled) {
      return true;
    }

    return false;
  }
}
