import { Command } from "commander";
import path from "path";
import { Environment } from "../misc/Environment.js";
import { Filesystem } from "../misc/Filesystem.js";
import { RelativePath } from "../misc/RelativePath.js";
import { CliArguments } from "../types.js";
import { h } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SchemaFileArgument extends ArgumentBase<"schemaFile"> {
  public name = "schemaFile" as const;
  public promptMessage = "Select the path to your GraphQL schema file";

  constructor(private fs: Filesystem, private env: Environment) {
    super();
    this.cliArg = "--schema-file";
  }

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-f", "<path>");

    command.option(flags, "path to a GraphQL schema file");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>
  ): Promise<CliArguments["schemaFile"]> {
    return this.showInquirerPrompt(
      {
        type: "input",
        validate: (input) => this.isValid(input, existingArgs),
      },
      existingArgs
    );
  }

  isValid(
    value: CliArguments["schemaFile"],
    existingArgs: Partial<CliArguments>
  ): true | string {
    if (!value) {
      return "Required";
    }

    const graphqlExt = ".graphql";

    const filename = path.basename(value);

    if (!filename.endsWith(graphqlExt)) {
      return `File needs to end in ${h(graphqlExt)}`;
    }

    if (!this.fs.isSubDirectory(this.env.targetDirectory, value)) {
      return `Must be directory below ${h(this.env.targetDirectory)}`;
    }

    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>
  ): Promise<CliArguments["schemaFile"]> {
    const filename = "schema.graphql";

    let srcPath: string = existingArgs.src!;

    if (existingArgs.toolchain === "next") {
      srcPath = "./src";
    }

    const filepath = path.join(this.env.targetDirectory, srcPath, filename);

    const relPath = new RelativePath(this.env.targetDirectory, filepath);

    return relPath.rel;
  }
}
