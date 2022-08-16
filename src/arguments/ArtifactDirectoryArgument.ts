import { Command } from "commander";
import path from "path";
import { CliArguments, EnvArguments } from "../types.js";
import { h, isSubDirectory } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class ArtifactDirectoryArgument extends ArgumentBase<"artifactDirectory"> {
  public name = "artifactDirectory" as const;
  public promptMessage =
    "Select, if needed, a directory to place all Relay artifacts in";

  constructor() {
    super();
    this.cliArg = "--artifact-directory";
  }

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-a", "<path>");

    command.option(flags, "directory to place all Relay artifacts in");
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
      if (existingArgs.toolchain === "next") {
        return "Required";
      }

      // The artifactDirectory is optional.
      return true;
    }

    if (path.basename(value) !== "__generated__") {
      return `Last directory segment should be called ${h("__generated__")}`;
    }

    if (!isSubDirectory(env.projectRootDirectory, value)) {
      return `Must be directory below ${h(env.projectRootDirectory)}`;
    }

    if (existingArgs.toolchain === "next") {
      const relativePagesDir = "./pages";
      const pagesDirectory = path.join(
        env.projectRootDirectory,
        relativePagesDir
      );

      if (isSubDirectory(pagesDirectory, value)) {
        return `Can not be under ${h(relativePagesDir)}`;
      }
    }

    return true;
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
