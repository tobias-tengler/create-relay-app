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
import { BABEL_RELAY_MACRO } from "./consts.js";
import { getEnvironment, hasUnsavedGitChanges } from "./helpers.js";
import { getPackageManger } from "./packageManagers/index.js";
import {
  getConfigFile,
  getMainFile,
  ProjectContext,
} from "./ProjectContext.js";
import {
  GenerateArtifactDirectoryTask,
  AddRelayEnvironmentProviderTask,
  GenerateRelayEnvironmentTask,
  GenerateGraphQlSchemaFileTask,
  TaskRunner,
  ConfigureRelayCompilerTask,
  ConfigureGraphQLTransformTask,
  AddBabelMacroTypeDefinitionsTask,
  InstallNpmDependenciesTask,
  InstallNpmDevDependenciesTask,
} from "./tasks/index.js";
import { CliArguments } from "./types.js";
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

const packageManager = getPackageManger(
  cliArgs.packageManager,
  env.projectRootDirectory
);

const context = new ProjectContext(env, cliArgs, packageManager);
context.mainFile = await getMainFile(env, cliArgs);
context.configFile = await getConfigFile(env, cliArgs);

// EXECUTE TASKS

const runner = new TaskRunner([
  new InstallNpmDependenciesTask(context),
  new InstallNpmDevDependenciesTask(context),
  new ConfigureRelayCompilerTask(context),
  new GenerateRelayEnvironmentTask(context),
  new GenerateGraphQlSchemaFileTask(context),
  new GenerateArtifactDirectoryTask(context),
  new AddRelayEnvironmentProviderTask(context),
  new ConfigureGraphQLTransformTask(context),
  new AddBabelMacroTypeDefinitionsTask(context),
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

console.log(
  `1. Replace ${h(context.schemaFile.rel)} with your own GraphQL schema file.`
);
console.log(
  `2. Replace the value of the ${h("HTTP_ENDPOINT")} variable in the ${h(
    context.relayEnvFile.rel
  )} file.`
);

if (context.is("cra")) {
  console.log();
  console.log(importantHeadline("Important"));
  console.log();
  console.log(
    `Remember you need to import ${h("graphql")} like the following:`
  );
  console.log("   " + h(`import graphql from \"${BABEL_RELAY_MACRO}\";`));
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
