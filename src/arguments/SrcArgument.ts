import { Command } from "commander";
import { Filesystem } from "../Filesystem.js";
import { CliArguments, EnvArguments } from "../types.js";
import { h } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SrcArgument extends ArgumentBase<"src"> {
  public name = "src" as const;
  public promptMessage = "Select the root directory of your application code";

  constructor(private fs: Filesystem) {
    super();
  }

  registerCliOption(command: Command, env: EnvArguments): void {
    const flags = this.getCliFlags("-s", "<path>");

    command.option(flags, "root directory of your application code");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments["src"]> {
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
    value: CliArguments["src"],
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    if (!value) {
      return `Required`;
    }

    if (!this.fs.isSubDirectory(env.projectRootDirectory, value)) {
      return `Must be directory below ${h(env.projectRootDirectory)}`;
    }

    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments["src"]> {
    if (existingArgs.toolchain === "next") {
      return "./";
    }

    return "./src";
  }
}
