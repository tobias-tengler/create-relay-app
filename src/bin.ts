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
  PACKAGE_FILE,
  REACT_RELAY_PACKAGE,
  BABEL_RELAY_PACKAGE,
} from "./consts.js";
import {
  getToolchainSettings,
  getRelayCompilerLanguage,
  getProjectRelayEnvFilepath,
  getRelayDevDependencies,
  getEnvironment,
  hasUnsavedGitChanges,
} from "./helpers.js";
import {
  GenerateArtifactDirectoryTask,
  AddRelayEnvironmentProviderTask,
  GenerateRelayEnvironmentTask,
  GenerateGraphQlSchemaFileTask,
  InstallNpmPackagesTask,
  TaskRunner,
  ConfigureRelayCompilerTask,
  ConfigureRelayGraphqlTransformTask,
  AddBabelMacroTypeDefinitionsTask,
} from "./tasks/index.js";
import { CliArguments, ProjectSettings } from "./types.js";
import {
  dim,
  headline,
  highlight,
  importantHeadline,
  prettifyRelativePath,
  printError,
} from "./utils/index.js";

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
        `Please commit or discard all changes in the ${highlight(
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

// todo: handle errors
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

// todo: can we simplify this or move it out of here?
const dependencies = [REACT_RELAY_PACKAGE];
const devDependencies = getRelayDevDependencies(
  settings.toolchain,
  settings.typescript
);

const relRelayEnvPath = prettifyRelativePath(
  settings.projectRootDirectory,
  settings.relayEnvFilepath
);

const relMainPath = prettifyRelativePath(
  settings.projectRootDirectory,
  settings.mainFilepath
);

const relConfigPath = prettifyRelativePath(
  settings.projectRootDirectory,
  settings.configFilepath
);

const relSchemaPath = prettifyRelativePath(
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
    title: `Configure ${highlight("relay-compiler")} in ${highlight(
      PACKAGE_FILE
    )}`,
    task: new ConfigureRelayCompilerTask(settings),
  },
  {
    title: `Configure Relay transform in ${highlight(relConfigPath)}`,
    task: new ConfigureRelayGraphqlTransformTask(settings),
    when: settings.toolchain !== "cra",
  },
  {
    title: `Add ${highlight(BABEL_RELAY_PACKAGE + "/macro")} type definitions`,
    task: new AddBabelMacroTypeDefinitionsTask(settings),
    when: settings.toolchain === "cra" && settings.typescript,
  },
  {
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

console.log(headline("Next steps"));
console.log();

console.log(
  `1. Replace ${highlight(relSchemaPath)} with your own GraphQL schema file.`
);
console.log(
  `2. Replace the value of the ${highlight(
    "HTTP_ENDPOINT"
  )} variable in the ${highlight(relRelayEnvPath)} file.`
);
console.log(
  `3. Add a ${highlight("Suspense")} boundary and ${highlight(
    "ErrorBoundary"
  )} to ${highlight(relMainPath)}.`
);

if (settings.toolchain === "cra") {
  console.log();
  console.log(importantHeadline("Important"));
  console.log();
  console.log(
    `Remember you need to import ${highlight("graphql")} like the following:`
  );
  console.log(
    "   " + highlight('import graphql from "babel-plugin-relay/macro";')
  );
  console.log();
  console.log(
    `Otherwise the transform of the ${highlight(
      "graphql"
    )}\`\` tagged literal will not work!`
  );

  // todo: link to craco or eject tutorial
}

console.log();
