import path from "path";
import {
  CliArguments,
  EnvArguments,
  ProjectSettings,
  RelayCompilerLanguage,
  Toolchain,
} from "./types.js";
import { PACKAGE_FILE } from "./consts.js";
import {
  getPackageDetails,
  headline,
  h,
  inferPackageManager,
  printError,
  traverseUpToFindFile,
  doesExist,
} from "./utils/index.js";
import { exit } from "process";
import { exec } from "child_process";
import { RelativePath } from "./RelativePath.js";

// todo: seperate this into meaningful files

export async function hasUnsavedGitChanges(dir: string): Promise<boolean> {
  const isPartOfGitRepo = await new Promise<boolean>((resolve) => {
    exec("git rev-parse --is-inside-work-tree", { cwd: dir }, (error) => {
      resolve(!error);
    });
  });

  if (!isPartOfGitRepo) {
    return false;
  }

  const hasUnsavedChanges = await new Promise<boolean>((resolve) => {
    exec("git status --porcelain", { cwd: dir }, (error, stdout) => {
      resolve(!!error || !!stdout);
    });
  });

  return hasUnsavedChanges;
}

export async function getEnvironment(
  ownPackageDirectory: string
): Promise<EnvArguments> {
  const workingDirectory = process.cwd();

  const pacMan = inferPackageManager();
  // todo: handle error
  const packageDetails = await getPackageDetails(ownPackageDirectory);

  const packageJsonFile = await traverseUpToFindFile(
    workingDirectory,
    PACKAGE_FILE
  );

  if (!packageJsonFile) {
    printError(
      `Could not find a ${h(PACKAGE_FILE)} in the ${h(
        workingDirectory
      )} directory.`
    );

    const pacManCreate = pacMan + " create ";

    console.log();
    console.log(headline("Correct usage"));
    console.log();

    console.log("1. Remember to first scaffold a project using:");
    console.log("   Next.js: " + h(pacManCreate + "next-app --typescript"));
    console.log("   Vite.js: " + h(pacManCreate + "vite --template react-ts"));
    console.log(
      "   Create React App: " +
        h(
          pacManCreate +
            "react-app <new-project-directory> --template typescript"
        )
    );
    console.log();
    console.log("2. Move into the scaffolded directory:");
    console.log("   " + h("cd <new-project-directory>"));
    console.log();
    console.log(`3. Run the ${packageDetails.name} script again:`);
    // todo: use pacManCreate once we hopefully have the create-relay-app name
    console.log("   " + h("npx -y " + packageDetails.name));

    exit(1);
  }

  const projectRootDirectory = path.dirname(packageJsonFile);

  return {
    workingDirectory,
    ownPackageDirectory,
    packageJsonFile,
    projectRootDirectory,
    ownPackageName: packageDetails.name,
    ownPackageDescription: packageDetails.description,
    ownPackageVersion: packageDetails.version,
  };
}

export function getRelayCompilerLanguage(
  useTypescript: boolean,
  toolchain: Toolchain
): RelayCompilerLanguage {
  if (
    useTypescript ||
    // Next does not support 'javascript' as an option,
    // only typescript or flow. So we opt for typescript
    // since it's more wide spread.
    toolchain === "next"
  ) {
    return "typescript";
  } else {
    return "javascript";
  }
}

export function getProjectRelayEnvFilepath(
  env: EnvArguments,
  args: CliArguments
): RelativePath {
  const filename = "RelayEnvironment" + (args.typescript ? ".ts" : ".js");

  const relativeDirectory = args.toolchain === "next" ? "./src" : args.src.rel;

  const filepath = path.join(relativeDirectory, filename);

  return new RelativePath(env.projectRootDirectory, filepath);
}

export async function getToolchainSettings(
  env: EnvArguments,
  args: CliArguments
): Promise<Pick<ProjectSettings, "mainFile" | "configFile">> {
  if (args.toolchain === "vite") {
    const configFilename = "vite.config" + (args.typescript ? ".ts" : ".js");

    const configFilepath = path.join(env.projectRootDirectory, configFilename);

    if (!(await doesExist(configFilepath))) {
      throw new Error(`${configFilename} not found`);
    }

    const mainFilename = "main" + (args.typescript ? ".tsx" : ".jsx");

    const mainFilepath = path.join(
      env.projectRootDirectory,
      "src",
      mainFilename
    );

    if (!(await doesExist(mainFilepath))) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFile: new RelativePath(env.projectRootDirectory, configFilepath),
      mainFile: new RelativePath(env.projectRootDirectory, mainFilepath),
    };
  } else if (args.toolchain === "next") {
    const configFilename = "next.config.js";

    const configFilepath = path.join(env.projectRootDirectory, configFilename);

    if (!(await doesExist(configFilepath))) {
      throw new Error(`${configFilename} not found`);
    }

    const mainFilename = "_app" + (args.typescript ? ".tsx" : ".js");

    const searchDirectory = path.join(env.projectRootDirectory, "pages");

    const mainFilepath = path.join(searchDirectory, mainFilename);

    if (!(await doesExist(mainFilepath))) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFile: new RelativePath(env.projectRootDirectory, configFilepath),
      mainFile: new RelativePath(env.projectRootDirectory, mainFilepath),
    };
  } else {
    const mainFilename = "index" + (args.typescript ? ".tsx" : ".js");

    const mainFilepath = path.join(
      env.projectRootDirectory,
      "src",
      mainFilename
    );

    if (!(await doesExist(mainFilepath))) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFile: null!,
      mainFile: new RelativePath(env.projectRootDirectory, mainFilepath),
    };
  }
}
