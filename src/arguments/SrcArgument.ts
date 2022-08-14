import { Command } from "commander";
import { CliArguments, EnvArguments } from "../types.js";
import { highlight, isSubDirectory } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SrcArgument extends ArgumentBase<"src"> {
  public name = "src" as const;
  public promptMessage = "Select the root directory of your application code";

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-s", "<path>");

    command.option(flags, "root directory of your application code");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<string> {
    return this.showInquirerPrompt(
      {
        type: "input",
        validate: (input) => this.isValid(input, existingArgs, env),
      },
      existingArgs,
      env
    );
  }

  isValid(
    value: string,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    if (!value) {
      return `Required`;
    }

    if (!isSubDirectory(env.projectRootDirectory, value)) {
      return `Must be directory below ${highlight(env.projectRootDirectory)}`;
    }

    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<string> {
    if (existingArgs.toolchain === "next") {
      return "./";
    }

    return "./src";
  }
}
