import { ArgumentBase } from "./ArgumentBase.js";
import { CliArguments } from "../types.js";
import { program } from "commander";
import { Environment } from "../misc/Environment.js";
import { RelativePath } from "../misc/RelativePath.js";

export class ArgumentHandler {
  private readonly argumentDefinitions: ArgumentBase<keyof CliArguments>[];

  constructor(argumentDefinitions: ArgumentBase<keyof CliArguments>[]) {
    this.argumentDefinitions = argumentDefinitions;
  }

  async parse(env: Environment): Promise<Partial<CliArguments>> {
    const details = await env.ownPackageJson.getDetails();

    program
      .name(details.name)
      .description(details.description)
      .version(details.version, `-v, --version`);

    // Register CLI options.
    for (const argumentDefinition of this.argumentDefinitions) {
      argumentDefinition.registerCliOption(program);
    }

    program
      .option(
        "--ignore-git-changes",
        "do not exit if the current directory has un-commited Git changes"
      )
      .option(
        "--skip-install",
        "skip the install of npm packages (only for testing)"
      )
      .option(`-y, --yes`, `answer \"yes\" to any prompts`);

    // Parse CLI options.
    await program.parseAsync();

    const cliArgs = program.opts<CliArguments>();

    // File paths specified are relative to the cwd.
    // We need to resolve them to absolute paths,
    // otherwise they will be treated as relative to the project directory.
    const normalizedCliArgs: Partial<CliArguments> = {
      ...cliArgs,
      // prettier-ignore
      schemaFile: this.normalizeRawCliPath(cliArgs.schemaFile, env.cwd, env.targetDirectory),
      // prettier-ignore
      src: this.normalizeRawCliPath(cliArgs.src, env.cwd, env.targetDirectory),
      // prettier-ignore
      artifactDirectory: this.normalizeRawCliPath(cliArgs.artifactDirectory, env.cwd, env.targetDirectory),
    };

    this.validateArgs(normalizedCliArgs);

    return normalizedCliArgs;
  }

  async promptForMissing(
    parsedArgs: Partial<CliArguments>
  ): Promise<CliArguments> {
    const allArgs: Partial<CliArguments> = { ...parsedArgs };

    for (const argumentDefinition of this.argumentDefinitions) {
      const existingValue = parsedArgs[argumentDefinition.name];

      if (existingValue !== undefined) {
        // Value was supplied as CLI argument, we don't need to prompt for it.
        argumentDefinition.submitWithValue(existingValue);
        continue;
      }

      if (!parsedArgs.yes) {
        const answer = await argumentDefinition.promptForValue(allArgs);

        // @ts-ignore
        allArgs[argumentDefinition.name] = answer;
      } else {
        // The user does not want to be prompted, so we choose default values.
        const defaultValue = await argumentDefinition.getDefaultValue(allArgs);

        argumentDefinition.submitWithValue(defaultValue);

        // @ts-ignore
        allArgs[argumentDefinition.name] = defaultValue;
      }
    }

    this.validateArgs(allArgs);

    return allArgs as CliArguments;
  }

  private validateArgs(args: Partial<CliArguments>) {
    for (const argumentDefinition of this.argumentDefinitions) {
      const value = args[argumentDefinition.name];

      if (value === undefined) {
        continue;
      }

      const valid = argumentDefinition.isValid(value, args);

      if (valid === true) {
        continue;
      }

      throw argumentDefinition.getInvalidArgError(value, undefined, valid);
    }
  }

  private normalizeRawCliPath(
    input: string | undefined,
    cwd: string,
    root: string
  ): string | undefined {
    if (!input) {
      return undefined;
    }

    const abs = new RelativePath(cwd, input).abs;

    return new RelativePath(root, abs).rel;
  }
}
