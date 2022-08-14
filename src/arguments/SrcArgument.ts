import { Command } from "commander";
import { CliArguments, EnvArguments } from "../types.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SrcArgument extends ArgumentBase<"src"> {
  public name = "src" as const;

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
        message: "Select the root directory of your application code",
        type: "input",
        //    validate: (input: string) =>
        //     isValidSrcDirectory(input, env.projectRootDirectory),
      },
      existingArgs,
      env
    );
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
