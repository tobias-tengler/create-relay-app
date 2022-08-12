#!/usr/bin/env node

import path, { dirname } from "path";
import { TaskRunner } from "./TaskRunner.js";
import { AddGraphQlSchemaFileTask } from "./tasks/AddGraphQlSchemaFileTask.js";
import chalk from "chalk";
import { AddRelayConfigurationTask } from "./tasks/AddRelayConfigurationTask.js";
import inquirer from "inquirer";
import {
  ProjectSettings,
  ToolChainOptions,
  LanguageOptions,
  PackageManagerOptions,
  ToolChain,
  CodeLanguage,
} from "./types.js";
import { InstallNpmPackagesTask } from "./tasks/InstallNpmPackagesTask.js";
import { AddRelayPluginConfigurationTask } from "./tasks/AddRelayPluginConfigurationTask.js";
import { AddRelayEnvironmentTask } from "./tasks/AddRelayEnvironmentTask.js";
import {
  traverseUpToFindFile,
  getPackageManagerToUse,
  getProjectToolChain,
  getProjectLanguage,
  hasUnsavedGitChanges,
  printError,
} from "./helpers.js";
import { exit } from "process";
import { PACKAGE_FILE, VITE_RELAY_PACKAGE } from "./consts.js";
import { fileURLToPath } from "url";

const packageDirectory = path.join(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);
const workingDirectory = process.cwd();

// FIND package.json FILE

const packageJsonFile = await traverseUpToFindFile(
  workingDirectory,
  PACKAGE_FILE
);

if (!packageJsonFile) {
  printError(
    `Could not find a ${chalk.cyan.bold(PACKAGE_FILE)} in the ${chalk.cyan.bold(
      workingDirectory
    )} directory.`
  );
  exit(1);
}

const projectRootDirectory = path.dirname(packageJsonFile);

// CHECK REPO FOR UNSAVED CHANGES

// const hasUnsavedChanges = await hasUnsavedGitChanges(projectRootDirectory);

// if (hasUnsavedChanges) {
//   printError(
//     `Please commit or discard all changes in the ${workingDirectory} before continuing.`
//   );
//   exit(1);
// }

// const settings = await readProjectSettings();
const settings = await getDefaultProjectSettings();

console.log();

const dependencies = ["react-relay"];
const devDependencies = getRelayDevDependencies(
  settings.toolChain,
  settings.language
);

const runner = new TaskRunner([
  {
    title: `Add Relay dependencies: ${dependencies
      .map((d) => chalk.cyan.bold(d))
      .join(" ")}`,
    task: new InstallNpmPackagesTask(
      dependencies,
      settings.packageManager,
      projectRootDirectory
    ),
  },
  {
    title: `Add Relay devDependencies: ${devDependencies
      .map((d) => chalk.cyan.bold(d))
      .join(" ")}`,
    task: new InstallNpmPackagesTask(
      devDependencies,
      settings.packageManager,
      projectRootDirectory,
      true
    ),
  },
  {
    title: "Add Relay configuration to package.json",
    task: new AddRelayConfigurationTask(
      packageJsonFile,
      settings.schemaFilePath,
      settings.language
    ),
  },
  {
    title: "Add Relay plugin configuration",
    task: new AddRelayPluginConfigurationTask(
      projectRootDirectory,
      settings.toolChain,
      settings.language
    ),
  },
  {
    title: "Add Relay environment",
    task: new AddRelayEnvironmentTask(
      projectRootDirectory,
      packageDirectory,
      settings.toolChain,
      settings.language
    ),
  },
  {
    title: `Generate GraphQL schema file (${chalk.cyan.bold(
      settings.schemaFilePath
    )})`,
    task: new AddGraphQlSchemaFileTask(settings.schemaFilePath),
  },
]);

try {
  await runner.run();
} catch {
  console.log();
  printError("Some of the tasks unexpectedly failed.");
  exit(1);
}

console.log();

console.log(chalk.italic.bold("### NEXT STEPS ###"));
console.log(
  `1. Replace ${chalk.cyan.bold(
    settings.schemaFilePath
  )} with your own GraphQL schema file.`
);
console.log(
  `2. Replace the ${chalk.cyan.bold(
    "HOST"
  )} variable in the RelayEnvironment.ts file.`
);

console.log();

// todo: add integration tests

async function getDefaultProjectSettings(): Promise<ProjectSettings> {
  const defaultPackageManager = getPackageManagerToUse();
  const defaultToolChain = await getProjectToolChain(
    projectRootDirectory,
    defaultPackageManager
  );
  const defaultLanguage = await getProjectLanguage(
    projectRootDirectory,
    defaultPackageManager
  );

  return {
    packageManager: defaultPackageManager,
    toolChain: defaultToolChain,
    language: defaultLanguage,
    schemaFilePath: "./schema.graphql",
  };
}

async function readProjectSettings(): Promise<ProjectSettings> {
  const defaults = await getDefaultProjectSettings();

  // todo: handle artifact directory
  // todo: handle error
  return await inquirer.prompt<ProjectSettings>([
    {
      name: "toolChain",
      message: "Select the toolchain your project is using",
      type: "list",
      default: defaults.toolChain,
      choices: ToolChainOptions,
    },
    {
      name: "language",
      message: "Select the language of your project",
      type: "list",
      default: defaults.language,
      choices: LanguageOptions,
    },
    {
      // todo: validate that it's inside project dir
      name: "schemaFilePath",
      message: "Select the path to your GraphQL schema file",
      type: "input",
      default: defaults.schemaFilePath,
      validate: (input: string) => {
        if (!input.endsWith(".graphql")) {
          return `File needs to end in ${chalk.green(".graphql")}`;
        }

        return true;
      },
    },
    {
      name: "packageManager",
      message: "Select the package manager you wish to use to install packages",
      type: "list",
      default: defaults.packageManager,
      choices: PackageManagerOptions,
    },
  ]);
}

export function getRelayDevDependencies(
  toolChain: ToolChain,
  language: CodeLanguage
) {
  let relayDevDep = ["relay-compiler"];

  if (toolChain === "Create-React-App") {
    relayDevDep = relayDevDep.concat(["babel-plugin-relay", "graphql"]);
  } else if (toolChain === "Vite") {
    relayDevDep.push(VITE_RELAY_PACKAGE);
  }

  if (language === "Typescript") {
    relayDevDep = relayDevDep.concat(["@types/react-relay"]);
  }

  return relayDevDep;
}
