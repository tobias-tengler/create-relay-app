import chalk from "chalk";
import { exec, spawn } from "child_process";
import { TS_CONFIG_FILE, TYPESCRIPT_PACKAGE } from "./consts.js";
import { findFileInDirectory } from "./helpers.js";
import { PackageManager } from "./types.js";

export function isValidSchemaPath(input: string): string | true {
  if (!input.endsWith(".graphql")) {
    return `File needs to end in ${chalk.green(".graphql")}`;
  }

  return true;
}

export function isValidSrcDirectory(input: string): string | true {
  if (!input) {
    return `Required`;
  }

  return true;
}

export function isValidArtifactDirectory(
  input: string | undefined
): string | true {
  if (!input) {
    return true;
  }

  return true;
}

export async function doesProjectUseTypescript(
  projectRootDirectory: string,
  manager: PackageManager
): Promise<boolean> {
  const tsconfigFile = await findFileInDirectory(
    projectRootDirectory,
    TS_CONFIG_FILE
  );

  if (!!tsconfigFile) {
    return true;
  }

  const typescriptInstalled = await isNpmPackageInstalled(
    manager,
    projectRootDirectory,
    TYPESCRIPT_PACKAGE
  );

  if (typescriptInstalled) {
    return true;
  }

  return false;
}

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

export async function isNpmPackageInstalled(
  manager: PackageManager,
  projectRootDirectory: string,
  packageName: string
): Promise<boolean> {
  const command = manager;
  const useYarn = manager === "yarn";

  let args: string[] = [];

  if (useYarn) {
    args = ["list", "--depth=0", "--pattern", packageName];
  } else {
    args = ["ls", "--depth=0", packageName];
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      // stdio: "inherit",
      cwd: projectRootDirectory,
      env: process.env,
      shell: true,
    });

    child.stdout.on("data", (data) => {
      const stringData = data.toString() as string;

      if (new RegExp(`\x20${packageName}@\\w`, "m").test(stringData)) {
        resolve(true);
      }
    });

    child.on("close", () => {
      resolve(false);
    });
  });
}
