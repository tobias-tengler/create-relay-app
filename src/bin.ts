#!/usr/bin/env node

import path from "path";
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
import { traverseUpToFindFile, getPackageManagerToUse } from "./helpers.js";

const workingDirectory = process.cwd();

// FIND package.json FILE

const packageJsonFile = await traverseUpToFindFile(
  workingDirectory,
  "package.json"
);

if (!packageJsonFile) {
  // package.json file is missing.
  throw new Error("package.json file is missing");
}

const projectRootDirectory = path.dirname(packageJsonFile);

// CHECK REPO FOR UNSAVED CHANGES

// const hasUnsavedChanges = await hasUnsavedGitChanges(projectDir);

// if (hasUnsavedChanges) {
//   throw new Error("Project has unsaved changes");
// }

const settings = await readProjectSettings();

console.log();

const dependencies = ["react-relay"];
const devDependencies = getRelayDevDependencies(
  settings.toolchain,
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
      settings.toolchain,
      settings.language
    ),
  },
  {
    title: "Add Relay environment",
    task: new AddRelayEnvironmentTask(),
  },
  {
    title: `Generate GraphQL schema file (${chalk.cyan.bold(
      settings.schemaFilePath
    )})`,
    task: new AddGraphQlSchemaFileTask(settings.schemaFilePath),
  },
]);

await runner.run();

console.log();

console.log(chalk.italic.bold("### NEXT STEPS ###"));
console.log(
  `1. Replace ${chalk.cyan.bold(
    settings.schemaFilePath
  )} with your own GraphQL schema file.`
);
console.log(`2. Replace the HOST variable in the RelayEnvironment.ts file.`);

console.log();

// todo: add integration tests

async function readProjectSettings(): Promise<ProjectSettings> {
  const defaultPackageManager = getPackageManagerToUse();

  // todo: handle artifact directory
  // todo: handle error
  return await inquirer.prompt<ProjectSettings>([
    {
      name: "toolchain",
      message: "Select the toolchain your project is using",
      type: "list",
      default: 0, // todo: try to infer the correct value
      choices: ToolChainOptions,
    },
    {
      name: "language",
      message: "Select the language of your project",
      type: "list",
      default: 0, // todo: try to infer the correct value
      choices: LanguageOptions,
    },
    {
      // todo: validate that it's inside project dir and ends in .graphql
      name: "schemaFilePath",
      message: "Select the path to your GraphQL schema file",
      type: "input",
      default: "./src/schema.graphql",
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
      default: defaultPackageManager,
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
    relayDevDep.push("vite-plugin-relay");
  }

  if (language === "Typescript") {
    relayDevDep = relayDevDep.concat(["@types/react-relay"]);
  }

  return relayDevDep;
}
