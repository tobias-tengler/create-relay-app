import path from "path";
import { PACKAGE_FILE } from "../consts.js";
import { PackageDetails, PackageManagerType } from "../types.js";
import { readFromFile, writeToFile } from "../utils/fs.js";
import { NpmPackageManager } from "./NpmPackageManager.js";
import { PackageManager } from "./PackageManager.js";
import { PnpmPackageManager } from "./PnpmPackageManager.js";
import { YarnPackageManager } from "./YarnPackageManager.js";

export type { PackageManager } from "./PackageManager.js";

export function getPackageManger(
  type: PackageManagerType,
  cwd: string
): PackageManager {
  switch (type) {
    case "npm":
      return new NpmPackageManager(cwd);
    case "yarn":
      return new YarnPackageManager(cwd);
    case "pnpm":
      return new PnpmPackageManager(cwd);
  }
}

export async function parsePackageJson(
  filepath: string
): Promise<Record<string, any>> {
  // todo: handle error
  const packageJsonContent = await readFromFile(filepath);

  const packageJson = JSON.parse(packageJsonContent);

  return packageJson;
}

export async function writePackageJson(
  filepath: string,
  content: Record<string, any>
) {
  const serializedPackageJson = JSON.stringify(content, null, 2);

  // todo: handle error
  await writeToFile(filepath, serializedPackageJson);
}

export async function isNpmPackageDependency(
  packageJsonFilepath: string,
  packageName: string
): Promise<boolean> {
  try {
    const packageJson = await parsePackageJson(packageJsonFilepath);

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

export async function getPackageDetails(
  ownPackageDirectory: string
): Promise<PackageDetails> {
  const ownPackageJsonFile = path.join(ownPackageDirectory, PACKAGE_FILE);

  const packageJson = await parsePackageJson(ownPackageJsonFile);

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

export function inferPackageManager(): PackageManagerType {
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
