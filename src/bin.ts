#!/usr/bin/env node

import path, { dirname } from "path";
import { TaskRunner } from "./TaskRunner.js";
import { AddGraphQlSchemaFileTask } from "./tasks/AddGraphQlSchemaFileTask.js";
import chalk from "chalk";
import { AddRelayConfigurationTask } from "./tasks/AddRelayConfigurationTask.js";
import inquirer from "inquirer";
import {
  CliArguments,
  ToolChainOptions,
  PackageManagerOptions,
  ToolChain,
  EnvArguments,
  ProjectSettings,
} from "./types.js";
import { InstallNpmPackagesTask } from "./tasks/InstallNpmPackagesTask.js";
import { AddRelayPluginConfigurationTask } from "./tasks/AddRelayPluginConfigurationTask.js";
import { AddRelayEnvironmentTask } from "./tasks/AddRelayEnvironmentTask.js";
import {
  traverseUpToFindFile,
  getProjectPackageManager as getProjectPackageManager,
  getProjectToolChain,
  doesProjectUseTypescript,
  hasUnsavedGitChanges,
  printError,
} from "./helpers.js";
import { exit } from "process";
import {
  BABEL_RELAY_PACKAGE,
  PACKAGE_FILE,
  VITE_RELAY_PACKAGE,
} from "./consts.js";
import { fileURLToPath } from "url";
import { OptionValues, program } from "commander";
import fs from "fs/promises";
import { getCliArguments } from "./cli.js";

const distDirectory = dirname(fileURLToPath(import.meta.url));
const ownPackageDirectory = path.join(distDirectory, "..");
const workingDirectory = process.cwd();
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

const envArguments: EnvArguments = {
  workingDirectory,
  ownPackageDirectory,
  packageJsonFile,
  projectRootDirectory,
};

// CHECK REPO FOR UNSAVED CHANGES
const skipChangesCheck = true;

if (!skipChangesCheck) {
  const hasUnsavedChanges = await hasUnsavedGitChanges(
    envArguments.projectRootDirectory
  );

  if (hasUnsavedChanges) {
    printError(
      `Please commit or discard all changes in the ${envArguments.projectRootDirectory} before continuing.`
    );
    exit(1);
  }
}

// todo: handle errors
const cliArguments = await getCliArguments(envArguments);

const settings: ProjectSettings = {
  ...envArguments,
  ...cliArguments,
  // todo: determine based on toolchain
  srcDirectory: "./src",
};

const dependencies = ["react-relay"];
const devDependencies = getRelayDevDependencies(
  settings.toolChain,
  settings.useTypescript
);

const runner = new TaskRunner([
  {
    title: `Add Relay dependencies: ${dependencies
      .map((d) => chalk.cyan.bold(d))
      .join(" ")}`,
    task: new InstallNpmPackagesTask(dependencies, false, settings),
  },
  {
    title: `Add Relay devDependencies: ${devDependencies
      .map((d) => chalk.cyan.bold(d))
      .join(" ")}`,
    task: new InstallNpmPackagesTask(devDependencies, true, settings),
  },
  {
    title: "Add Relay configuration to package.json",
    task: new AddRelayConfigurationTask(settings),
  },
  {
    title: "Add Relay plugin configuration",
    task: new AddRelayPluginConfigurationTask(settings),
  },
  {
    title: "Add Relay environment",
    task: new AddRelayEnvironmentTask(settings),
  },
  {
    title: `Generate GraphQL schema file (${chalk.cyan.bold(
      settings.schemaFilePath
    )})`,
    task: new AddGraphQlSchemaFileTask(settings),
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

console.log(chalk.yellow.bold("Next steps:"));

console.log(
  `1. Replace ${chalk.cyan.bold(
    settings.schemaFilePath
  )} with your own GraphQL schema file.`
);

// todo: get correct path to file
console.log(
  `2. Replace the value of the ${chalk.cyan.bold(
    "HOST"
  )} variable in the RelayEnvironment.ts file.`
);

console.log();

function getRelayDevDependencies(toolChain: ToolChain, useTypescript: boolean) {
  const relayDevDep = ["relay-compiler"];

  if (useTypescript) {
    relayDevDep.push("@types/react-relay");
    relayDevDep.push("@types/relay-runtime");
  }

  if (toolChain === "cra" || toolChain === "vite") {
    relayDevDep.push(BABEL_RELAY_PACKAGE);
  }

  if (toolChain === "vite") {
    relayDevDep.push(VITE_RELAY_PACKAGE);
  }

  return relayDevDep;
}
