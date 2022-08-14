import { Command } from "commander";
import { CliArguments, EnvArguments } from "../types.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class ArtifactDirectoryArgument extends ArgumentBase<"artifactDirectory"> {
  public name = "artifactDirectory" as const;

  registerCliOption(command: Command): void {
    // todo: should be --artifact-directory
    const flags = this.getCliFlags("-a", "<path>");

    command.option(flags, "directory to place all Relay artifacts in");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<string> {
    return this.showInquirerPrompt(
      {
        message:
          "Select, if needed, a directory to place all Relay artifacts in",
        type: "input",
        // validate: (input: string, answers: Partial<CliArguments> | undefined) =>
        //   isValidArtifactDirectory(
        //     input,
        //     answers?.toolchain ?? defaults.toolchain,
        //     env.projectRootDirectory
        //   ),
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
      // Artifacts need to be located outside the ./pages directory,
      // or they will be treated as pages.
      return "./__generated__";
    }

    return "";
  }
}
