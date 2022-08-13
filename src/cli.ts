import {
  CliArguments,
  EnvArguments,
  PackageManager,
  PackageManagerOptions,
  Toolchain,
  ToolchainOptions,
} from "./types.js";
import { program } from "commander";
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
    .version(PACKAGE_VERSION, `-v, ${VERSION_ARG}`);

  // If you change argumemts, make sure to match up RawCliArguments as well.
  program
    .option(
      `-t, ${TOOLCHAIN_ARG} <toolchain>`,
      "the toolchain used to bundle / serve the project",
      parseToolChain
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
      "the package manager to use for installing packages",
      parsePackageManager
    )
    .option(
      IGNORE_GIT_CHANGES_ARG,
      "do not exit if the current directory has un-commited Git changes"
    )
    .option(`-y, ${YES_ARG}`, `answer \"yes\" to any prompts`);

  program.parse();

  return program.opts<CliArguments>();
}

export async function promptForMissingCliArguments(
  existingArgs: Partial<CliArguments>,
  env: EnvArguments
): Promise<CliArguments> {
  const defaults = await getDefaultCliArguments(existingArgs, env);

  if (existingArgs.yes) {
    return { ...defaults, ...getSpecifiedProperties(existingArgs) };
  }

  // todo: maybe handle subscription or @defer / @stream setup
  // todo: handle error
  const answers = await inquirer.prompt<Partial<CliArguments>>([
    {
      name: "toolchain",
      message: "Select the toolchain your project is using",
      type: "list",
      default: defaults.toolchain,
      choices: ToolchainOptions,
      when: !existingArgs.toolchain,
    },
    {
      name: "typescript",
      message: "Does your project use Typescript",
      type: "confirm",
      default: defaults.typescript,
      when: !existingArgs.typescript,
    },
    {
      name: "src",
      message: "Select the source directory",
      type: "input",
      default: defaults.src,
      validate: (input: string) =>
        isValidSrcDirectory(input, env.projectRootDirectory),
      when: !existingArgs.src,
    },
    {
      name: "schemaFile",
      message: "Select the path to your GraphQL schema file",
      type: "input",
      default: (answers: CliArguments) =>
        getProjectSchemaFilepath(
          answers.toolchain ?? defaults.toolchain,
          answers.src ?? defaults.src
        ),
      validate: (input: string) =>
        isValidSchemaPath(input, env.projectRootDirectory),
      when: !existingArgs.schemaFile,
    },
    {
      name: "artifactDirectory",
      message: "Select the artifactDirectory",
      type: "input",
      default: defaults.artifactDirectory,
      validate: (input: string, answers: Partial<CliArguments> | undefined) =>
        isValidArtifactDirectory(
          input,
          answers?.toolchain ?? defaults.toolchain,
          env.projectRootDirectory
        ),
      when: !existingArgs.artifactDirectory,
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

function parsePackageManager(rawInput?: string): PackageManager | null {
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

function parseToolChain(rawInput?: string): Toolchain | null {
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
