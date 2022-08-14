#!/usr/bin/env node

import path, { dirname } from "path";
import { exit } from "process";
import { fileURLToPath } from "url";
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
} from "./tasks/index.js";
import { EnvArguments, CliArguments, ProjectSettings } from "./types.js";
import {
  dim,
  getPackageDetails,
  headline,
  highlight,
  inferPackageManager,
  prettifyRelativePath,
  printError,
  traverseUpToFindFile,
} from "./utils/index.js";
import { hasUnsavedGitChanges } from "./validation.js";

// INIT ENVIRONMENT

const distDirectory = dirname(fileURLToPath(import.meta.url));
const ownPackageDirectory = path.join(distDirectory, "..");
const workingDirectory = process.cwd();

// todo: handle error
const pacMan = inferPackageManager();
const packageDetails = await getPackageDetails(ownPackageDirectory);

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

  const pacManCreate = pacMan + " create ";

  console.log();
  console.log(headline("Correct usage"));
  console.log();

  console.log("1. Remember to first scaffold a project using:");
  console.log(
    "   Next.js: " + highlight(pacManCreate + "next-app --typescript")
  );
  console.log(
    "   Vite.js: " + highlight(pacManCreate + "vite --template react-ts")
  );
  console.log(
    "   Create React App: " +
      highlight(
        pacManCreate + "react-app <new-project-directory> --template typescript"
      )
  );
  console.log();
  console.log("2. Move into the scaffolded directory:");
  console.log("   " + highlight("cd <new-project-directory>"));
  console.log();
  console.log("3. Install the referenced packages:");
  console.log("   " + highlight(pacMan + " install"));
  console.log();
  console.log(`4. Run the ${packageDetails.name} script again:`);
  // todo: use pacManCreate once we hopefully have the create-relay-app name
  console.log("   " + highlight("npx -y " + packageDetails.name));

  exit(1);
}

const projectRootDirectory = path.dirname(packageJsonFile);

const envArguments: EnvArguments = {
  launcher: pacMan,
  workingDirectory,
  ownPackageDirectory,
  packageJsonFile,
  projectRootDirectory,
  ownPackageName: packageDetails.name,
  ownPackageDescription: packageDetails.description,
  ownPackageVersion: packageDetails.version,
};

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

  const partialCliArguments = await argumentHandler.parse(envArguments);

  // todo: this is kind of awkward here
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

  cliArgs = await argumentHandler.promptForMissing(
    partialCliArguments,
    envArguments
  );

  console.log();

  console.log({ cliArgs });
} catch (error) {
  if (error instanceof Error) {
    printError("Error while parsing CLI arguments: " + error.message);
  } else {
    printError("Unexpected error while parsing CLI arguments");
  }

  exit(1);
}

const toolchainSettings = await getToolchainSettings(envArguments, cliArgs);

const settings: ProjectSettings = {
  ...envArguments,
  ...cliArgs,
  compilerLanguage: getRelayCompilerLanguage(
    cliArgs.typescript,
    cliArgs.toolchain
  ),
  relayEnvFilepath: getProjectRelayEnvFilepath(envArguments, cliArgs),
  ...toolchainSettings,
};

// EXECUTE TASKS

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
    when: !!settings.configFilepath, // todo: remove once cra is fully supported
  },
  {
    title: `Generate Relay environment ${highlight(relRelayEnvPath)}`,
    task: new GenerateRelayEnvironmentTask(settings),
  },
  {
    title: `Add RelayEnvironmentProvider to ${highlight(relMainPath)}`,
    task: new AddRelayEnvironmentProviderTask(settings),
    when: !!settings.configFilepath, // todo: remove once cra is fully supported
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
  `2. Replace the value of the ${highlight("HOST")} variable in the ${highlight(
    relRelayEnvPath
  )} file.`
);

// todo: remove once cra is fully supported

if (settings.toolchain === "cra") {
  console.log(
    `3. Setup ${highlight(
      BABEL_RELAY_PACKAGE
    )} to conform to your project. ${dim("(This will soon be automated!)")}`
  );
}

console.log();
