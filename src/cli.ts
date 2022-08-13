import path from "path";
import { PACKAGE_FILE } from "./consts.js";
import {
  CliArguments,
  EnvArguments,
  PackageManager,
  PackageManagerOptions,
  ToolChain,
  ToolChainOptions,
} from "./types.js";
import fs from "fs/promises";
import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import {
  getProjectToolChain,
  doesProjectUseTypescript,
  getProjectPackageManager,
} from "./helpers.js";

type RawCliArguments = Partial<{
  toolchain: string;
  typescript: boolean;
  schemaFile: string;
  packageManager: string;
  ignoreGitChanges: boolean;
  yes: boolean;
}>;

export async function getCliArguments(
  env: EnvArguments
): Promise<Partial<CliArguments>> {
  const {
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    description: PACKAGE_DESCRIPTION,
  } = await getPackageDetails(env);

  program
    .name(PACKAGE_NAME)
    .description(PACKAGE_DESCRIPTION)
    .version(PACKAGE_VERSION, "-v, --version");

  // If you change argumemts, make to match up RawCliArguments as well.
  program
    .option(
      "-t, --toolchain <toolchain>",
      "the toolchain used to bundle / serve the project"
    )
    .option("--typescript", "use Typescript")
    .option(
      "-s, --schema-file <path>",
      "path to a GraphQL schema file, relative to the root directory"
    )
    .option("-p, --package-manager <manager>")
    .option(
      "--ignore-git-changes",
      "do not exit if the current directory has un-commited Git changes"
    )
    .option("-y, --yes", `answer \"yes\" to any prompts`);

  program.parse();

  const rawCliArguments = program.opts<RawCliArguments>();
  const partialCliArguments = parseCliArguments(rawCliArguments);

  return partialCliArguments;
}

export async function promptForMissingCliArguments(
  existingArgs: Partial<CliArguments>,
  env: EnvArguments
): Promise<CliArguments> {
  const defaults = await getDefaultCliArguments(existingArgs, env);

  const definedExistingArgs = { ...existingArgs };

  (Object.keys(definedExistingArgs) as (keyof CliArguments)[]).forEach(
    (k) => definedExistingArgs[k] === undefined && delete definedExistingArgs[k]
  );

  // todo: find better way to skip prompts, but still show inquirer results
  if (existingArgs.skipPrompts) {
    return { ...defaults, ...definedExistingArgs };
  }

  // todo: handle artifact directory
  // todo: maybe handle subscription or @defer / @stream setup
  // todo: handle error
  const answers = await inquirer.prompt<CliArguments>([
    {
      name: "toolChain",
      message: "Select the toolchain your project is using",
      type: "list",
      default: defaults.toolChain,
      choices: ToolChainOptions,
      when: !existingArgs.toolChain,
    },
    {
      name: "useTypescript",
      message: "Does your project use Typescript",
      type: "confirm",
      default: defaults.useTypescript,
      when: !existingArgs.useTypescript,
    },
    {
      name: "schemaFilePath",
      message: "Select the path to your GraphQL schema file",
      type: "input",
      default: defaults.schemaFilePath,
      // todo: also have this validation for cli args
      // todo: validate that it's inside project dir
      validate: (input: string) => {
        if (!input.endsWith(".graphql")) {
          return `File needs to end in ${chalk.green(".graphql")}`;
        }

        return true;
      },
      when: !existingArgs.schemaFilePath,
    },
    {
      name: "packageManager",
      message: "Select the package manager you wish to use to install packages",
      type: "list",
      default: defaults.packageManager,
      choices: PackageManagerOptions,
      when: !existingArgs.packageManager,
    },
  ]);

  console.log();

  return { ...answers, ...definedExistingArgs };
}

function parseCliArguments(args: RawCliArguments): Partial<CliArguments> {
  return {
    toolChain: tryParseToolChain(args.toolchain),
    packageManager: tryParsePackageManager(args.packageManager),
    schemaFilePath: args.schemaFile,
    useTypescript: args.typescript,
    skipPrompts: args.yes,
    ignoreGitChanges: args.ignoreGitChanges,
  };
}

async function getDefaultCliArguments(
  existingArgs: Partial<CliArguments>,
  env: EnvArguments
): Promise<CliArguments> {
  const packageManager =
    existingArgs.packageManager ||
    (await getProjectPackageManager(env.projectRootDirectory));

  const toolChain =
    existingArgs.toolChain ||
    (await getProjectToolChain(packageManager, env.projectRootDirectory));

  const useTypescript =
    existingArgs.useTypescript ||
    (await doesProjectUseTypescript(env.projectRootDirectory, packageManager));

  // todo: use the src directory as base once configurable
  const schemaFilePath = existingArgs.schemaFilePath || "./schema.graphql";

  const ignoreGitChanges = existingArgs.ignoreGitChanges || false;
  const skipPrompts = existingArgs.skipPrompts || false;

  return {
    packageManager,
    toolChain,
    useTypescript,
    schemaFilePath,
    ignoreGitChanges,
    skipPrompts,
  };
}

type PackageDetails = Readonly<{
  name: string;
  version: string;
  description: string;
}>;

async function getPackageDetails(env: EnvArguments): Promise<PackageDetails> {
  const ownPackageJsonFile = path.join(env.ownPackageDirectory, PACKAGE_FILE);

  const packageJsonContent = await fs.readFile(ownPackageJsonFile, "utf8");

  const packageJson = JSON.parse(packageJsonContent);

  const name = packageJson?.name;

  if (!name) {
    throw new Error(`Could not determine name in ${ownPackageJsonFile}`);
  }

  const version = packageJson?.version;

  if (!version) {
    throw new Error(`Could not determine version in ${ownPackageJsonFile}`);
  }

  const description = packageJson?.description;

  if (!description) {
    throw new Error(`Could not determine description in ${ownPackageJsonFile}`);
  }

  return { name, version, description };
}

function tryParsePackageManager(rawInput?: string): PackageManager | undefined {
  if (!rawInput) {
    return undefined;
  }

  const input = getNormalizedCliString(rawInput);

  if (input === "yarn") {
    return "yarn";
  }

  if (input === "pnpm") {
    return "pnpm";
  }

  if (input === "npm") {
    return "npm";
  }

  throw invalidArgError("--package-manager", input, PackageManagerOptions);
}

function tryParseToolChain(rawInput?: string): ToolChain | undefined {
  if (!rawInput) {
    return undefined;
  }

  const input = getNormalizedCliString(rawInput);

  if (input === "next") {
    return "next";
  }

  if (input === "vite") {
    return "vite";
  }

  if (input === "cra") {
    return "cra";
  }

  throw invalidArgError("--toolchain", input, ToolChainOptions);
}

function invalidArgError(
  arg: string,
  value: string,
  validValues: readonly string[] | string
): Error {
  const validValue: string =
    validValues instanceof Array ? validValues.join(", ") : validValues;

  return new Error(
    `Received an invalid value for ${arg}. Valid values are: ${validValue}. Received: ${value}`
  );
}

function getNormalizedCliString(input?: string): string {
  return input?.toLowerCase().trim() || "";
}
