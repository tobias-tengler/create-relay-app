import { spawn } from "child_process";
import path from "path";
import { PACKAGE_FILE } from "../consts.js";
import { PackageManager } from "../types.js";
import { readFromFile } from "./fs.js";

export async function isNpmPackageDependency(
  packageJsonFilepath: string,
  packageName: string
): Promise<boolean> {
  try {
    const packageJsonContent = await readFromFile(packageJsonFilepath);

    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = packageJson["dependencies"] ?? {};
    const devDpendencies = packageJson["devDependencies"] ?? {};

    const installedPackages = Object.keys({
      ...dependencies,
      ...devDpendencies,
    });

    return installedPackages.includes(packageName);
  } catch {
    return false;
  }
}

/** @deprecated Takes too long to lookup */
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

export function installNpmPackages(
  manager: PackageManager,
  projectRootDirectory: string,
  packages: string[],
  isDevDependency: boolean
) {
  const command = manager;
  const useYarn = command === "yarn";
  let args: string[] = [];

  if (useYarn) {
    args = ["add", "--exact", "--cwd", projectRootDirectory];

    if (isDevDependency) {
      args.push("--dev");
    }

    args.push(...packages);
  } else {
    args = [
      "install",
      "--save-exact",
      isDevDependency ? "--save-dev" : "--save",
    ];

    args.push(...packages);
  }

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      // stdio: "inherit",
      cwd: projectRootDirectory,
      env: process.env,
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(" ")}` });
        return;
      }

      resolve();
    });
  });
}

type PackageDetails = Readonly<{
  name: string;
  version: string;
  description: string;
}>;

export async function getPackageDetails(
  ownPackageDirectory: string
): Promise<PackageDetails> {
  const ownPackageJsonFile = path.join(ownPackageDirectory, PACKAGE_FILE);

  const packageJsonContent = await readFromFile(ownPackageJsonFile);

  const packageJson = JSON.parse(packageJsonContent);

  const name = packageJson?.name;

  if (!name) {
    throw new Error(`Could not determine name in ${ownPackageJsonFile}`);
  }

  const version = packageJson?.version;

  if (!version) {
    throw new Error(`Could not determine version in ${ownPackageJsonFile}`);
  }

  const description = packageJson?.description;

  if (!description) {
    throw new Error(`Could not determine description in ${ownPackageJsonFile}`);
  }

  return { name, version, description };
}

export function inferPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;

  // If this script is being run by a specific manager,
  // we use this mananger.
  if (userAgent) {
    if (userAgent.startsWith("yarn")) {
      return "yarn";
    } else if (userAgent.startsWith("pnpm")) {
      return "pnpm";
    }
  }

  return "npm";
}
