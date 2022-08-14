import path from "path";
import { PACKAGE_FILE } from "../consts.js";
import { PackageManager } from "../types.js";
import { readFromFile } from "./fs.js";

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
