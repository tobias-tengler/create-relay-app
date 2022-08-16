import path from "path";
import { EnvArguments } from "./types.js";
import { PACKAGE_FILE } from "./consts.js";
import {
  headline,
  h,
  printError,
  traverseUpToFindFile,
} from "./utils/index.js";
import { exit } from "process";
import { exec } from "child_process";
import {
  inferPackageManager,
  getPackageDetails,
} from "./packageManagers/index.js";

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
