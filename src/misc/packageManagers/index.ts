import { PackageManagerType } from "../../types.js";
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
