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
import {
  getToolchainSettings,
  getRelayCompilerLanguage,
  getProjectRelayEnvFilepath,
  getEnvironment,
  hasUnsavedGitChanges,
} from "./helpers.js";
import {
  GenerateArtifactDirectoryTask,
  AddRelayEnvironmentProviderTask,
  GenerateRelayEnvironmentTask,
  GenerateGraphQlSchemaFileTask,
  TaskRunner,
  ConfigureRelayCompilerTask,
  ConfigureRelayGraphqlTransformTask,
  AddBabelMacroTypeDefinitionsTask,
  InstallNpmDependenciesTask,
  InstallNpmDevDependenciesTask,
} from "./tasks/index.js";
import { CliArguments, ProjectSettings } from "./types.js";
import { headline, h, importantHeadline, printError } from "./utils/index.js";

// INIT ENVIRONMENT

const distDirectory = dirname(fileURLToPath(import.meta.url));
const ownPackageDirectory = path.join(distDirectory, "..");

const env = await getEnvironment(ownPackageDirectory);

// GET ARGUMENTS

const argumentDefinitions = [
  new ToolchainArgument(),
  new TypescriptArgument(),
  new SrcArgument(),
  new SchemaFileArgument(),
  new ArtifactDirectoryArgument(),
  new PackageManagerArgument(),
];

let cliArgs: CliArguments;

try {
  const argumentHandler = new ArgumentHandler(argumentDefinitions);

  const partialCliArguments = await argumentHandler.parse(env);

  // todo: this is kind of awkward here
  if (!partialCliArguments.ignoreGitChanges) {
    const hasUnsavedChanges = await hasUnsavedGitChanges(
      env.projectRootDirectory
    );

    if (hasUnsavedChanges) {
      printError(
        `Please commit or discard all changes in the ${h(
          env.projectRootDirectory
        )} directory before continuing.`
      );
      exit(1);
    }
  }

  cliArgs = await argumentHandler.promptForMissing(partialCliArguments, env);

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

// todo: handle errors and put this in a dedicated class
const settings: ProjectSettings = {
  ...env,
  ...cliArgs,
  compilerLanguage: getRelayCompilerLanguage(
    cliArgs.typescript,
    cliArgs.toolchain
  ),
  relayEnvFilepath: getProjectRelayEnvFilepath(env, cliArgs),
  ...(await getToolchainSettings(env, cliArgs)),
};

// EXECUTE TASKS

const runner = new TaskRunner([
  new InstallNpmDependenciesTask(settings),
  new InstallNpmDevDependenciesTask(settings),
  new ConfigureRelayCompilerTask(settings),
  new GenerateRelayEnvironmentTask(settings),
  new GenerateGraphQlSchemaFileTask(settings),
  new GenerateArtifactDirectoryTask(settings),
  new AddRelayEnvironmentProviderTask(settings),
  new ConfigureRelayGraphqlTransformTask(settings),
  new AddBabelMacroTypeDefinitionsTask(settings),
]);

try {
  await runner.run();
} catch {
  console.log();
  printError("Some of the tasks failed unexpectedly.");
  exit(1);
}

// DISPLAY RESULT

console.log();
console.log();

console.log(headline("Next steps"));
console.log();

// console.log(
//   `1. Replace ${h(relSchemaPath)} with your own GraphQL schema file.`
// );
// console.log(
//   `2. Replace the value of the ${h("HTTP_ENDPOINT")} variable in the ${h(
//     relRelayEnvPath
//   )} file.`
// );

if (settings.toolchain === "cra") {
  console.log();
  console.log(importantHeadline("Important"));
  console.log();
  console.log(
    `Remember you need to import ${h("graphql")} like the following:`
  );
  console.log("   " + h('import graphql from "babel-plugin-relay/macro";'));
  console.log();
  console.log(
    `Otherwise the transform of the ${h(
      "graphql``"
    )} tagged literal will not work!`
  );
  console.log(
    "If you do not want to use the macro, you can check out the following document for guidance:"
  );
  console.log(
    "https://github.com/tobias-tengler/create-relay-app/blob/main/docs/cra-babel-setup.md"
  );
}

console.log();
