import { ArgumentBase } from "./ArgumentBase.js";
import { CliArguments, EnvArguments } from "../types.js";
import { program } from "commander";
import { prettifyPath } from "../utils/index.js";

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

  async promptForMissing(
    parsedArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments> {
    const allArgs: Partial<CliArguments> = { ...parsedArgs };

    for (const argumentDefinition of this.argumentDefinitions) {
      const existingValue = parsedArgs[argumentDefinition.name];

      if (existingValue !== undefined) {
        // Value was supplied as CLI argument, we don't need to prompt for it.
        continue;
      }

      // todo: get rid of tsignores
      if (!parsedArgs.yes) {
        const answer = await argumentDefinition.promptForValue(allArgs, env);

        // @ts-ignore
        allArgs[argumentDefinition.name] = answer;
      } else {
        // The user does not want to be prompted, so we choose default values.
        const defaultValue = await argumentDefinition.getDefaultValue(
          allArgs,
          env
        );

        // todo: display in same format as prompt
        console.log(
          "Choose default value for " +
            argumentDefinition.name +
            ": " +
            defaultValue
        );

        // @ts-ignore
        allArgs[argumentDefinition.name] = defaultValue;
      }
    }

    // todo: implement validation

    return {
      ...allArgs,
      src: allArgs.src ? prettifyPath(allArgs.src) : "",
      schemaFile: allArgs.schemaFile ? prettifyPath(allArgs.schemaFile) : "",
      artifactDirectory: allArgs.artifactDirectory
        ? prettifyPath(allArgs.artifactDirectory)
        : "",
    } as CliArguments;
  }
}
