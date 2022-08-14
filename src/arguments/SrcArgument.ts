import { Command } from "commander";
import { ArgumentBase } from "./ArgumentBase.js";

export class SrcArgument extends ArgumentBase<"src"> {
  public name = "src" as const;

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-s", "<path>");

    command.option(flags, "root directory of your application code");
  }

  promptForValue(): Promise<string> {
    return this.showInquirerPrompt({
      message: "Select the root directory of your application code",
      type: "input",
      //    validate: (input: string) =>
      //     isValidSrcDirectory(input, env.projectRootDirectory),
    });
  }

  async getDefaultValue(): Promise<string> {
    //      if (toolchain === "next") {
    //     return "./";
    //   }

    return "./src";
  }
}
