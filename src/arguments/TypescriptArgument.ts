import { Command } from "commander";
import path from "path";
import { TS_CONFIG_FILE, TYPESCRIPT_PACKAGE } from "../misc/consts.js";
import { Environment } from "../misc/Environment.js";
import { Filesystem } from "../misc/Filesystem.js";
import { CliArguments } from "../types.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class TypescriptArgument extends ArgumentBase<"typescript"> {
  public name = "typescript" as const;
  public promptMessage = "Does your project use Typescript";

  constructor(private fs: Filesystem, private env: Environment) {
    super();
  }

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags();

    command.option(flags, "use Typescript");
  }

  promptForValue(existingArgs: Partial<CliArguments>): Promise<boolean> {
    return this.showInquirerPrompt(
      {
        type: "confirm",
      },
      existingArgs
    );
  }

  isValid(value: boolean, existingArgs: Partial<CliArguments>): true | string {
    return true;
  }

  async getDefaultValue(existingArgs: Partial<CliArguments>): Promise<boolean> {
    const tsconfigFile = path.join(this.env.targetDirectory, TS_CONFIG_FILE);

    if (await this.fs.doesExist(tsconfigFile)) {
      return true;
    }

    const typescriptInstalled = await this.env.packageJson.containsDependency(
      TYPESCRIPT_PACKAGE
    );

    if (typescriptInstalled) {
      return true;
    }

    return false;
  }
}
