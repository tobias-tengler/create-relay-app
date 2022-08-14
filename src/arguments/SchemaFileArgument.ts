import { Command } from "commander";
import path from "path";
import { CliArguments, EnvArguments } from "../types.js";
import { prettifyPath } from "../utils/index.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class SchemaFileArgument extends ArgumentBase<"schemaFile"> {
  public name = "schemaFile" as const;

  registerCliOption(command: Command): void {
    // todo: should be --schema-file
    const flags = this.getCliFlags("-f", "<path>");

    command.option(flags, "path to a GraphQL schema file");
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<string> {
    return this.showInquirerPrompt(
      {
        message: "Select the path to your GraphQL schema file",
        type: "input",
        //   validate: (input: string) =>
        //     isValidSchemaPath(input, env.projectRootDirectory),
      },
      existingArgs,
      env
    );
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<string> {
    const filename = "schema.graphql";

    let srcPath: string = existingArgs.src!;

    if (existingArgs.toolchain === "next") {
      srcPath = "src";
    }

    return prettifyPath(path.join(srcPath, filename));
  }
}
