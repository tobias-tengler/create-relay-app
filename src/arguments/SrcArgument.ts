import { Command } from "commander";
import { Environment } from "../misc/Environment.js";
import { Filesystem } from "../misc/Filesystem.js";
import { CliArguments } from "../types.js";
import { h } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SrcArgument extends ArgumentBase<"src"> {
  public name = "src" as const;
  public promptMessage = "Select the root directory of your application code";

  constructor(private fs: Filesystem, private env: Environment) {
    super();
  }

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-s", "<path>");

    command.option(flags, "root directory of your application code");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>
  ): Promise<CliArguments["src"]> {
    return this.showInquirerPrompt(
      {
        type: "input",
        validate: (input) => this.isValid(input, existingArgs),
      },
      existingArgs
    );
  }

  isValid(
    value: CliArguments["src"],
    existingArgs: Partial<CliArguments>
  ): true | string {
    if (!value) {
      return `Required`;
    }

    if (!this.fs.isDirectory(value)) {
      return `Must be a directory`;
    }

    if (!this.fs.isSubDirectory(this.env.targetDirectory, value)) {
      return `Must be directory below ${h(this.env.targetDirectory)}`;
    }

    return true;
  }

  getDefaultValue(
    existingArgs: Partial<CliArguments>
  ): Promise<CliArguments["src"]> {
    if (existingArgs.toolchain === "next") {
      return Promise.resolve("./");
    }

    return Promise.resolve("./src");
  }
}
