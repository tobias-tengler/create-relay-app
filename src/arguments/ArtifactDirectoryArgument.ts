import { Command } from "commander";
import path from "path";
import { Environment } from "../misc/Environment.js";
import { Filesystem } from "../misc/Filesystem.js";
import { RelativePath } from "../misc/RelativePath.js";
import { CliArguments } from "../types.js";
import { h } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class ArtifactDirectoryArgument extends ArgumentBase<"artifactDirectory"> {
  public name = "artifactDirectory" as const;
  public promptMessage =
    "Select, if needed, a directory to place all Relay artifacts in";

  constructor(private fs: Filesystem, private env: Environment) {
    super();
    this.cliArg = "--artifact-directory";
  }

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-a", "<path>");

    command.option(flags, "directory to place all Relay artifacts in");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>
  ): Promise<CliArguments["artifactDirectory"]> {
    return this.showInquirerPrompt(
      {
        type: "input",
        validate: (input) => this.isValid(input, existingArgs),
      },
      existingArgs
    );
  }

  isValid(
    value: CliArguments["artifactDirectory"],
    existingArgs: Partial<CliArguments>
  ): true | string {
    if (!value) {
      if (existingArgs.toolchain === "next") {
        return "Required";
      }

      // The artifactDirectory is optional.
      return true;
    }

    if (!this.fs.isDirectory(value)) {
      return `Must be a directory`;
    }

    if (path.basename(value) !== "__generated__") {
      return `Last directory segment should be called ${h("__generated__")}`;
    }

    if (!this.fs.isSubDirectory(this.env.targetDirectory, value)) {
      return `Must be directory below ${h(this.env.targetDirectory)}`;
    }

    if (existingArgs.toolchain === "next") {
      const pagesDirectory = new RelativePath(
        this.env.targetDirectory,
        "./pages"
      );

      if (this.fs.isSubDirectory(pagesDirectory.abs, value)) {
        return `Can not be under ${h(pagesDirectory.rel)}`;
      }
    }

    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>
  ): Promise<CliArguments["artifactDirectory"]> {
    if (existingArgs.toolchain === "next") {
      // Artifacts need to be located outside the ./pages directory,
      // or they will be treated as pages.
      return "./__generated__";
    }

    return "";
  }
}
