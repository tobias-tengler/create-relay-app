import { Command } from "commander";
import { ArgumentBase } from "./ArgumentBase.js";

export class SchemaFileArgument extends ArgumentBase<"schemaFile"> {
  public name = "schemaFile" as const;

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-f", "<path>");

    command.option(flags, "path to a GraphQL schema file");
  }

  promptForValue(): Promise<string> {
    return this.showInquirerPrompt({
      message: "Select the path to your GraphQL schema file",
      type: "input",
      //   default: (answers: CliArguments) =>
      //     getProjectSchemaFilepath(
      //       answers.toolchain ?? defaults.toolchain,
      //       answers.src ?? defaults.src
      //     ),
      //   validate: (input: string) =>
      //     isValidSchemaPath(input, env.projectRootDirectory),
    });
  }

  async getDefaultValue(): Promise<string> {
    const filename = "schema.graphql";

    //   let srcPath: string = srcDirectoryPath;

    //   if (toolchain === "next") {
    //     srcPath = "src";
    //   }

    //   return prettifyPath(path.join(srcPath, filename));

    return filename;
  }
}
