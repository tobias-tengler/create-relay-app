import {
  CliArguments,
  EnvArguments,
  Optional,
  PackageManager,
  PackageManagerOptions,
  Toolchain,
  ToolchainOptions,
} from "./types.js";
import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { getPackageDetails, getSpecifiedProperties } from "./helpers.js";
import {
  getDefaultCliArguments,
  getProjectSchemaFilepath,
} from "./defaults.js";
import {
  isValidArtifactDirectory,
  isValidSchemaPath,
  isValidSrcDirectory,
} from "./validation.js";
import {
  ARTIFACT_DIR_ARG,
  IGNORE_GIT_CHANGES_ARG,
  PACKAGE_MANAGER_ARG,
  SCHEMA_FILE_ARG,
  SRC_DIR_ARG,
  TOOLCHAIN_ARG,
  TYPESCRIPT_ARG,
  VERSION_ARG,
  YES_ARG,
} from "./consts.js";

type RawCliArguments = Partial<{
  toolchain: string;
  typescript: boolean;
  schemaFile: string;
  src: string;
  artifactDirectory: string;
  packageManager: string;
  ignoreGitChanges: boolean;
  yes: boolean;
}>;

export async function getCliArguments(
  env: EnvArguments
): Promise<Optional<CliArguments>> {
  const {
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    description: PACKAGE_DESCRIPTION,
  } = await getPackageDetails(env);

  program
    .name(PACKAGE_NAME)
    .description(PACKAGE_DESCRIPTION)
    .version(PACKAGE_VERSION, `-v, ${VERSION_ARG}`);

  // If you change argumemts, make sure to match up RawCliArguments as well.
  program
    .option(
      `-t, ${TOOLCHAIN_ARG} <toolchain>`,
      "the toolchain used to bundle / serve the project"
    )
    .option(TYPESCRIPT_ARG, "use Typescript")
    .option(
      `-f,  ${SCHEMA_FILE_ARG} <path>`,
      "path to a GraphQL schema file, relative to the root directory"
    )
    .option(
      `-s, ${SRC_DIR_ARG} <path>`,
      "path to the directory, where the Relay compiler will be run on"
    )
    .option(
      `-a, ${ARTIFACT_DIR_ARG} <path>`,
      "path to the directory, where the Relay compiler will be run on"
    )
    .option(
      `-p, ${PACKAGE_MANAGER_ARG} <manager>`,
      "the package manager to use for installing packages"
    )
    .option(
      IGNORE_GIT_CHANGES_ARG,
      "do not exit if the current directory has un-commited Git changes"
    )
    .option(`-y, ${YES_ARG}`, `answer \"yes\" to any prompts`);

  program.parse();

  const rawCliArguments = program.opts<RawCliArguments>();
  const partialCliArguments = parseCliArguments(rawCliArguments);

  return partialCliArguments;
}

export async function promptForMissingCliArguments(
  existingArgs: Optional<CliArguments>,
  env: EnvArguments
): Promise<CliArguments> {
  const defaults = await getDefaultCliArguments(existingArgs, env);

  if (existingArgs.skipPrompts) {
    return { ...defaults, ...getSpecifiedProperties(existingArgs) };
  }

  // todo: maybe handle subscription or @defer / @stream setup
  // todo: handle error
  const answers = await inquirer.prompt<CliArguments>([
    {
      name: "toolchain",
      message: "Select the toolchain your project is using",
      type: "list",
      default: defaults.toolchain,
      choices: ToolchainOptions,
      when: !existingArgs.toolchain,
    },
    {
      name: "useTypescript",
      message: "Does your project use Typescript",
      type: "confirm",
      default: defaults.useTypescript,
      when: !existingArgs.useTypescript,
    },

    {
      name: "srcDirectoryPath",
      message: "Select the source directory",
      type: "input",
      default: defaults.srcDirectoryPath,
      validate: isValidSrcDirectory,
      when: !existingArgs.srcDirectoryPath,
    },
    {
      name: "schemaFilePath",
      message: "Select the path to your GraphQL schema file",
      type: "input",
      default: (answers: Partial<CliArguments>) =>
        getProjectSchemaFilepath(
          answers.toolchain ?? defaults.toolchain,
          answers.srcDirectoryPath ?? defaults.srcDirectoryPath
        ),
      validate: isValidSchemaPath,
      when: !existingArgs.schemaFilePath,
    },
    {
      name: "artifactDirectoryPath",
      message: "Select the artifactDirectory",
      type: "input",
      default: defaults.artifactDirectoryPath,
      validate: (input: string, answers: Partial<CliArguments> | undefined) =>
        isValidArtifactDirectory(
          input,
          answers?.toolchain ?? defaults.toolchain
        ),
      when: !existingArgs.artifactDirectoryPath,
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

  return { ...defaults, ...answers };
}

function parseCliArguments(args: RawCliArguments): Optional<CliArguments> {
  return {
    toolchain: tryParseToolChain(args.toolchain),
    packageManager: tryParsePackageManager(args.packageManager),
    srcDirectoryPath: args.src || null,
    artifactDirectoryPath: args.artifactDirectory || null,
    schemaFilePath: args.schemaFile || null,
    useTypescript: args.typescript || null,
    skipPrompts: args.yes || null,
    ignoreGitChanges: args.ignoreGitChanges || null,
  };
}

function tryParsePackageManager(rawInput?: string): PackageManager | null {
  if (!rawInput) {
    return null;
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

  throw invalidArgError(PACKAGE_MANAGER_ARG, input, PackageManagerOptions);
}

function tryParseToolChain(rawInput?: string): Toolchain | null {
  if (!rawInput) {
    return null;
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

  throw invalidArgError(TOOLCHAIN_ARG, input, ToolchainOptions);
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
