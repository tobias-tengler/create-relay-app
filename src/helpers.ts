import path from "path";
import {
  CliArguments,
  EnvArguments,
  ProjectSettings,
  RelayCompilerLanguage,
  Toolchain,
} from "./types.js";
import {
  BABEL_RELAY_PACKAGE,
  PACKAGE_FILE,
  VITE_RELAY_PACKAGE,
} from "./consts.js";
import {
  findFileInDirectory,
  getPackageDetails,
  headline,
  highlight,
  inferPackageManager,
  printError,
  traverseUpToFindFile,
} from "./utils/index.js";
import { exit } from "process";
import { exec } from "child_process";

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
          pacManCreate +
            "react-app <new-project-directory> --template typescript"
        )
    );
    console.log();
    console.log("2. Move into the scaffolded directory:");
    console.log("   " + highlight("cd <new-project-directory>"));
    console.log();
    console.log(`3. Run the ${packageDetails.name} script again:`);
    // todo: use pacManCreate once we hopefully have the create-relay-app name
    console.log("   " + highlight("npx -y " + packageDetails.name));

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

export function getRelayDevDependencies(
  toolchain: Toolchain,
  useTypescript: boolean
) {
  const relayDevDep = ["relay-compiler"];

  if (useTypescript) {
    relayDevDep.push("@types/react-relay");
    relayDevDep.push("@types/relay-runtime");
  }

  if (toolchain === "cra" || toolchain === "vite") {
    relayDevDep.push(BABEL_RELAY_PACKAGE);
  }

  if (toolchain === "vite") {
    relayDevDep.push(VITE_RELAY_PACKAGE);
  }

  return relayDevDep;
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
): string {
  const filename = "RelayEnvironment" + (args.typescript ? ".ts" : ".js");

  const relativeDirectory = args.toolchain === "next" ? "src" : args.src;

  const directory = path.join(env.projectRootDirectory, relativeDirectory);

  return path.join(directory, filename);
}

export async function getToolchainSettings(
  env: EnvArguments,
  args: CliArguments
): Promise<Pick<ProjectSettings, "mainFilepath" | "configFilepath">> {
  if (args.toolchain === "vite") {
    const configFilename = "vite.config" + (args.typescript ? ".ts" : ".js");

    const configFilepath = await findFileInDirectory(
      env.projectRootDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(`${configFilename} not found`);
    }

    const mainFilename = "main" + (args.typescript ? ".tsx" : ".jsx");

    const searchDirectory = path.join(env.projectRootDirectory, "src");

    const mainFilepath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilepath) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFilepath,
      mainFilepath,
    };
  } else if (args.toolchain === "next") {
    const configFilename = "next.config.js";

    const configFilepath = await findFileInDirectory(
      env.projectRootDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(`${configFilename} not found`);
    }

    const mainFilename = "_app" + (args.typescript ? ".tsx" : ".js");

    const searchDirectory = path.join(env.projectRootDirectory, "pages");

    const mainFilepath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilepath) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFilepath,
      mainFilepath,
    };
  } else {
    const mainFilename = "index" + (args.typescript ? ".tsx" : ".jsx");

    const searchDirectory = path.join(env.projectRootDirectory, "src");

    const mainFilepath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilepath) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFilepath: "",
      mainFilepath,
    };
  }
}
