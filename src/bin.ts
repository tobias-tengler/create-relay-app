#!/usr/bin/env node

import path, { dirname } from "path";
import { exit } from "process";
import { fileURLToPath } from "url";
import { InvalidArgError } from "./arguments/ArgumentBase.js";
import {
  ArgumentHandler,
  ArtifactDirectoryArgument,
  PackageManagerArgument,
  SchemaFileArgument,
  SrcArgument,
  ToolchainArgument,
  TypescriptArgument,
} from "./arguments/index.js";
import { BABEL_RELAY_MACRO, PACKAGE_FILE } from "./consts.js";
import { Filesystem } from "./misc/Filesystem.js";
import {
  getPackageManger,
  inferPackageManager,
} from "./misc/packageManagers/index.js";
import {
  GenerateArtifactDirectoryTask,
  GenerateRelayEnvironmentTask,
  GenerateGraphQlSchemaFileTask,
  TaskRunner,
  ConfigureRelayCompilerTask,
  Cra_AddBabelMacroTypeDefinitionsTask,
  InstallNpmDependenciesTask,
  InstallNpmDevDependenciesTask,
  Vite_ConfigureVitePluginRelayTask,
  Next_ConfigureNextCompilerTask,
  Cra_AddRelayEnvironmentProvider,
  Vite_AddRelayEnvironmentProvider,
  Next_AddRelayEnvironmentProvider,
} from "./tasks/index.js";
import { CliArguments } from "./types.js";
import { headline, h, importantHeadline, printError } from "./utils/index.js";
import { ProjectContext } from "./misc/ProjectContext.js";
import { Environment, MissingPackageJsonError } from "./misc/Environment.js";
import { Git } from "./misc/Git.js";

const fs = new Filesystem();

// We need to determine where our package was installed to,
// since we later might need to access files from this location.
const distDirectory = dirname(fileURLToPath(import.meta.url));
const ownPackageJsonFilepath = path.join(distDirectory, "..", PACKAGE_FILE);

const cwd = process.cwd();
const pacMan = inferPackageManager();

const env = new Environment(cwd, ownPackageJsonFilepath, fs);

// Determine environment information, such as where the package.json
// of the target project lies.
try {
  await env.init();
} catch (error) {
  if (error instanceof MissingPackageJsonError) {
    // prettier-ignore
    printError(`Could not find a ${h(PACKAGE_FILE)} in the ${h(cwd)} directory.`);

    console.log();
    console.log(headline("Correct usage"));
    console.log();

    console.log("1. Remember to first scaffold a project using:");
    console.log("   Next.js: " + h(pacMan + "create next-app --typescript"));
    console.log("   Vite.js: " + h(pacMan + "create vite --template react-ts"));
    // prettier-ignore
    console.log("   Create React App: " + h(pacMan + "create react-app <new-project-directory> --template typescript"));
    console.log();
    console.log("2. Move into the scaffolded directory:");
    console.log("   " + h("cd <new-project-directory>"));
    console.log();
    // todo: replace with create-relay-app, if we hopefully get the name.
    console.log(`3. Run the @tobiastengler/relay-app script again:`);
    console.log("   " + h(pacMan + "create @tobiastengler/relay-app"));
  } else if (error instanceof Error) {
    // prettier-ignore
    printError("Unexpected error while gathering environment information: " + error.message);
  } else {
    // prettier-ignore
    printError("Unexpected error while gathering environment information");
  }

  exit(1);
}

if (cwd !== env.targetDirectory) {
  // prettier-ignore
  console.log(`Determined project root directory to be ` + h(env.targetDirectory));
  console.log();
}

// Define all of the possible CLI arguments.
const argumentHandler = new ArgumentHandler([
  new ToolchainArgument(env),
  new TypescriptArgument(fs, env),
  new SrcArgument(fs, env),
  new SchemaFileArgument(fs, env),
  new ArtifactDirectoryArgument(fs, env),
  new PackageManagerArgument(fs, env),
]);

let cliArgs: CliArguments;

// Try to parse the CLI arguments
try {
  // Get the arguments provided to the program.
  const cliProvidedArgs = await argumentHandler.parse(env);

  // todo: this is kind of awkward here
  if (!cliProvidedArgs.ignoreGitChanges) {
    const git = new Git();
    const hasUnsavedChanges = await git.hasUnsavedChanges(env.targetDirectory);

    if (hasUnsavedChanges) {
      // prettier-ignore
      printError(`Please commit or discard all changes in the ${h(env.targetDirectory)} directory before continuing.`);
      exit(1);
    }
  }

  // Prompt for all of the missing arguments, required to execute the program.
  cliArgs = await argumentHandler.promptForMissing(cliProvidedArgs);

  console.log();
} catch (error) {
  if (error instanceof InvalidArgError) {
    printError(error.message);
  } else if (error instanceof Error) {
    printError("Error while parsing CLI arguments: " + error.message);
  } else {
    printError("Unexpected error while parsing CLI arguments");
  }

  exit(1);
}

// Instantiate a package manager, based on the user's choice.
const packageManager = getPackageManger(
  cliArgs.packageManager,
  env.targetDirectory
);

// Build a context that contains all of the configuration.
const context = new ProjectContext(env, cliArgs, packageManager, fs);

// Define tasks that should be executed.
const runner = new TaskRunner([
  new InstallNpmDependenciesTask(context),
  new InstallNpmDevDependenciesTask(context),
  new ConfigureRelayCompilerTask(context),
  new GenerateRelayEnvironmentTask(context),
  new GenerateGraphQlSchemaFileTask(context),
  new GenerateArtifactDirectoryTask(context),
  new Cra_AddBabelMacroTypeDefinitionsTask(context),
  new Vite_ConfigureVitePluginRelayTask(context),
  new Next_ConfigureNextCompilerTask(context),
  new Cra_AddRelayEnvironmentProvider(context),
  new Vite_AddRelayEnvironmentProvider(context),
  new Next_AddRelayEnvironmentProvider(context),
]);

// Execute all of the tasks sequentially.
try {
  await runner.run();
} catch {
  console.log();
  // todo: provide error message
  printError("Some of the tasks failed unexpectedly.");
  exit(1);
}

console.log();
console.log();

// Display a guide to the user on how to continue setting up his project.
console.log(headline("Next steps"));
console.log();

// prettier-ignore
console.log(`1. Replace ${h(context.schemaFile.rel)} with your own GraphQL schema file.`);
// prettier-ignore
console.log(`2. Replace the value of the ${h("HTTP_ENDPOINT")} variable in the ${h(context.relayEnvFile.rel)} file.`);

// Create React app comes with some annoyances, so we warn the user about it,
// and provide possible solutions that can be manually implemented.
if (context.is("cra")) {
  console.log();
  console.log(importantHeadline("Important"));
  console.log();
  // prettier-ignore
  console.log(`Remember you need to import ${h("graphql")} like the following:`);
  console.log("   " + h(`import graphql from \"${BABEL_RELAY_MACRO}\";`));
  console.log();
  // prettier-ignore
  console.log(`Otherwise the transform of the ${h("graphql``")} tagged literal will not work!`);
  // prettier-ignore
  console.log("If you do not want to use the macro, you can check out the following document for guidance:");
  // prettier-ignore
  console.log("https://github.com/tobias-tengler/create-relay-app/blob/main/docs/cra-babel-setup.md");
}

console.log();
