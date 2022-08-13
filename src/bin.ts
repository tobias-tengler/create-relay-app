#!/usr/bin/env node

import path, { dirname } from "path";
import { TaskRunner } from "./TaskRunner.js";
import { GenerateGraphQlSchemaFileTask } from "./tasks/GenerateGraphQlSchemaFileTask.js";
import chalk from "chalk";
import { AddRelayConfigurationTask } from "./tasks/AddRelayConfigurationTask.js";
import { CliArguments, EnvArguments, ProjectSettings } from "./types.js";
import { InstallNpmPackagesTask } from "./tasks/InstallNpmPackagesTask.js";
import { ConfigureRelayGraphqlTransformTask } from "./tasks/ConfigureRelayGraphqlTransformTask.js";
import { AddRelayEnvironmentProviderTask } from "./tasks/AddRelayEnvironmentProviderTask.js";
import {
  traverseUpToFindFile,
  printError,
  getRelayDevDependencies,
  getRelayCompilerLanguage,
  highlight,
  printInvalidArg,
  getToolchainSettings,
  getRelayEnvFilepath,
  normalizePath,
  getRelativePath,
} from "./helpers.js";
import { exit } from "process";
import {
  ARTIFACT_DIR_ARG,
  PACKAGE_FILE,
  REACT_RELAY_PACKAGE,
  SCHEMA_FILE_ARG,
  SRC_DIR_ARG,
} from "./consts.js";
import { fileURLToPath } from "url";
import { getCliArguments, promptForMissingCliArguments } from "./cli.js";
import {
  hasUnsavedGitChanges,
  isValidArtifactDirectory,
  isValidSchemaPath,
  isValidSrcDirectory,
} from "./validation.js";
import { GenerateRelayEnvironmentTask } from "./tasks/GenerateRelayEnvironmentTask.js";
import { GenerateArtifactDirectoryTask } from "./tasks/GenerateArtifactDirectoryTask.js";

// INIT ENVIRONMENT

const distDirectory = dirname(fileURLToPath(import.meta.url));
const ownPackageDirectory = path.join(distDirectory, "..");
const workingDirectory = process.cwd();
const packageJsonFile = await traverseUpToFindFile(
  workingDirectory,
  PACKAGE_FILE
);

if (!packageJsonFile) {
  printError(
    `Could not find a ${highlight(PACKAGE_FILE)} in the ${highlight(
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

// GET ARGUMENTS

let cliArgs: CliArguments;

try {
  const partialCliArguments = await getCliArguments(envArguments);

  if (!partialCliArguments.ignoreGitChanges) {
    const hasUnsavedChanges = await hasUnsavedGitChanges(
      envArguments.projectRootDirectory
    );

    if (hasUnsavedChanges) {
      printError(
        `Please commit or discard all changes in the ${highlight(
          envArguments.projectRootDirectory
        )} directory before continuing.`
      );
      exit(1);
    }
  }

  cliArgs = await promptForMissingCliArguments(
    partialCliArguments,
    envArguments
  );
} catch (error) {
  if (error instanceof Error) {
    printError(error.message);
  } else {
    printError("Unexpected error while parsing CLI arguments");
  }

  exit(1);
}

// VALIDATE ARGUMENTS

const schemaPathValid = isValidSchemaPath(
  cliArgs.schemaFile,
  envArguments.projectRootDirectory
);

if (schemaPathValid !== true) {
  printInvalidArg(SCHEMA_FILE_ARG, schemaPathValid, cliArgs.schemaFile);
  exit(1);
}

const srcDirValid = isValidSrcDirectory(
  cliArgs.src,
  envArguments.projectRootDirectory
);

if (srcDirValid !== true) {
  printInvalidArg(SRC_DIR_ARG, srcDirValid, cliArgs.src);

  exit(1);
}

const artifactDirValid = isValidArtifactDirectory(
  cliArgs.artifactDirectory,
  cliArgs.toolchain,
  envArguments.projectRootDirectory
);

if (artifactDirValid !== true) {
  printInvalidArg(
    ARTIFACT_DIR_ARG,
    artifactDirValid,
    cliArgs.artifactDirectory
  );
  exit(1);
}

const toolchainSettings = await getToolchainSettings(envArguments, cliArgs);

const settings: ProjectSettings = {
  ...envArguments,
  ...cliArgs,
  compilerLanguage: getRelayCompilerLanguage(cliArgs.typescript),
  relayEnvFilepath: getRelayEnvFilepath(envArguments, cliArgs),
  ...toolchainSettings,
};

console.log(settings);

// EXECUTE TASKS

const dependencies = [REACT_RELAY_PACKAGE];
const devDependencies = getRelayDevDependencies(
  settings.toolchain,
  settings.typescript
);

const relRelayEnvPath = getRelativePath(
  settings.projectRootDirectory,
  settings.relayEnvFilepath
);

const relMainPath = getRelativePath(
  settings.projectRootDirectory,
  settings.mainFilepath
);

const relConfigPath = getRelativePath(
  settings.projectRootDirectory,
  settings.configFilepath
);

const relSchemaPath = getRelativePath(
  settings.projectRootDirectory,
  settings.schemaFile
);

const runner = new TaskRunner([
  {
    title: `Add Relay dependencies: ${dependencies
      .map((d) => highlight(d))
      .join(" ")}`,
    task: new InstallNpmPackagesTask(dependencies, false, settings),
  },
  {
    title: `Add Relay devDependencies: ${devDependencies
      .map((d) => highlight(d))
      .join(" ")}`,
    task: new InstallNpmPackagesTask(devDependencies, true, settings),
  },
  {
    title: `Add Relay configuration to ${highlight(PACKAGE_FILE)}`,
    task: new AddRelayConfigurationTask(settings),
  },
  {
    title: `Configure Relay transform in ${highlight(relConfigPath)}`,
    task: new ConfigureRelayGraphqlTransformTask(settings),
  },
  {
    // todo: path is not relative
    title: `Generate Relay environment ${highlight(relRelayEnvPath)}`,
    task: new GenerateRelayEnvironmentTask(settings),
  },
  {
    title: `Add RelayEnvironmentProvider to ${highlight(relMainPath)}`,
    task: new AddRelayEnvironmentProviderTask(settings),
  },
  {
    title: `Generate GraphQL schema file ${highlight(relSchemaPath)}`,
    task: new GenerateGraphQlSchemaFileTask(settings),
  },
  {
    title: `Generate artifact directory ${highlight(
      settings.artifactDirectory!
    )}`,
    task: new GenerateArtifactDirectoryTask(settings),
    when: !!settings.artifactDirectory,
  },
]);

try {
  await runner.run();
} catch {
  console.log();
  printError("Some of the tasks failed unexpectedly.");
  exit(1);

  // todo: if tasks fail, display ways to resovle the tasks manually
}

// DISPLAY RESULT

console.log();
console.log();

console.log(chalk.cyan.bold.underline("Next steps"));
console.log();

console.log(
  `1. Replace ${highlight(relSchemaPath)} with your own GraphQL schema file.`
);

console.log(
  `2. Replace the value of the ${highlight("HOST")} variable in the ${highlight(
    relRelayEnvPath
  )} file.`
);

console.log();
