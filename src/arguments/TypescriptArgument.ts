import { Command } from "commander";
import path from "path";
import { TS_CONFIG_FILE, TYPESCRIPT_PACKAGE } from "../consts.js";
import { CliArguments, EnvArguments } from "../types.js";
import { doesExist, isNpmPackageDependency } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class TypescriptArgument extends ArgumentBase<"typescript"> {
  public name = "typescript" as const;
  public promptMessage = "Does your project use Typescript";

  registerCliOption(command: Command, env: EnvArguments): void {
    const flags = this.getCliFlags();

    command.option(flags, "use Typescript");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<boolean> {
    return this.showInquirerPrompt(
      {
        type: "confirm",
      },
      existingArgs,
      env
    );
  }

  isValid(
    value: boolean,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<boolean> {
    const tsconfigFile = path.join(env.projectRootDirectory, TS_CONFIG_FILE);

    if (await doesExist(tsconfigFile)) {
      return true;
    }

    const typescriptInstalled = await isNpmPackageDependency(
      env.packageJsonFile,
      TYPESCRIPT_PACKAGE
    );

    if (typescriptInstalled) {
      return true;
    }

    return false;
  }
}
