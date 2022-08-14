import { ArgumentBase } from "./ArgumentBase.js";
import { CliArguments, EnvArguments } from "../types.js";
import { program } from "commander";
import { prettifyPath, printError } from "../utils/index.js";
import { exit } from "process";

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

    this.validateArgs(cliArgs, env);

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

        argumentDefinition.submitWithValue(defaultValue);

        // @ts-ignore
        allArgs[argumentDefinition.name] = defaultValue;
      }
    }

    this.validateArgs(allArgs, env);

    return {
      ...allArgs,
      src: allArgs.src ? prettifyPath(allArgs.src) : "",
      schemaFile: allArgs.schemaFile ? prettifyPath(allArgs.schemaFile) : "",
      artifactDirectory: allArgs.artifactDirectory
        ? prettifyPath(allArgs.artifactDirectory)
        : "",
    } as CliArguments;
  }

  private validateArgs(args: Partial<CliArguments>, env: EnvArguments) {
    for (const argumentDefinition of this.argumentDefinitions) {
      const value = args[argumentDefinition.name];

      if (value === undefined) {
        continue;
      }

      const valid = argumentDefinition.isValid(value, args, env);

      if (valid === true) {
        continue;
      }

      throw argumentDefinition.getInvalidArgError(value, undefined, valid);
    }
  }
}
