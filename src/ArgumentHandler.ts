import { ArgumentBase } from "./arguments/ArgumentBase.js";
import { CliArguments, EnvArguments } from "./types.js";
import { program } from "commander";

export class ArgumentHandler {
  private readonly argumentDefinitions: ArgumentBase<keyof CliArguments>[];

  constructor(argumentDefinitions: ArgumentBase<keyof CliArguments>[]) {
    this.argumentDefinitions = argumentDefinitions;
  }

  async parse(env: EnvArguments): Promise<Partial<CliArguments>> {
    program
      .name(env.ownPackageName)
      .description(env.ownPackageDescription)
      .version(env.ownPackageVersion, `-v, --version`);

    program
      .option(
        "--ignore-git-changes",
        "do not exit if the current directory has un-commited Git changes"
      )
      .option(`-y, --yes`, `answer \"yes\" to any prompts`);

    // Register CLI options.
    for (const argumentDefinition of this.argumentDefinitions) {
      argumentDefinition.registerCliOption(program);
    }

    // Parse CLI options.
    await program.parseAsync();

    const cliArgs = program.opts<CliArguments>();

    return cliArgs;
  }

  promptForMissing(parsedArgs: Partial<CliArguments>): Promise<CliArguments> {
    return null!;
  }
}
