import { Command } from "commander";
import path from "path";
import { Filesystem } from "../Filesystem.js";
import { RelativePath } from "../RelativePath.js";
import { CliArguments, EnvArguments } from "../types.js";
import { h } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SchemaFileArgument extends ArgumentBase<"schemaFile"> {
  public name = "schemaFile" as const;
  public promptMessage = "Select the path to your GraphQL schema file";

  constructor(private fs: Filesystem) {
    super();
    this.cliArg = "--schema-file";
  }

  registerCliOption(command: Command, env: EnvArguments): void {
    const flags = this.getCliFlags("-f", "<path>");

    command.option(flags, "path to a GraphQL schema file");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments["schemaFile"]> {
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
    value: CliArguments["schemaFile"],
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    if (!value) {
      return "Required";
    }

    const graphqlExt = ".graphql";

    const filename = path.basename(value);

    if (!filename.endsWith(graphqlExt)) {
      return `File needs to end in ${h(graphqlExt)}`;
    }

    if (!this.fs.isSubDirectory(env.projectRootDirectory, value)) {
      return `Must be directory below ${h(env.projectRootDirectory)}`;
    }

    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments["schemaFile"]> {
    const filename = "schema.graphql";

    let srcPath: string = existingArgs.src!;

    if (existingArgs.toolchain === "next") {
      srcPath = "./src";
    }

    const filepath = path.join(env.projectRootDirectory, srcPath, filename);

    const relPath = new RelativePath(env.projectRootDirectory, filepath);

    return relPath.rel;
  }
}
