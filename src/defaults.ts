import { execSync } from "child_process";
import { findFileInDirectory } from "./helpers.js";
import {
  CliArguments,
  EnvArguments,
  Optional,
  PackageManager,
  ToolChain,
} from "./types.js";
import {
  doesProjectUseTypescript,
  isNpmPackageInstalled,
} from "./validation.js";

export async function getDefaultCliArguments(
  existingArgs: Optional<CliArguments>,
  env: EnvArguments
): Promise<CliArguments> {
  const packageManager =
    existingArgs.packageManager ||
    (await getProjectPackageManager(env.projectRootDirectory));

  const toolChain =
    existingArgs.toolChain ||
    (await getProjectToolChain(packageManager, env.projectRootDirectory));

  const useTypescript =
    existingArgs.useTypescript ||
    (await doesProjectUseTypescript(env.projectRootDirectory, packageManager));

  // todo: use other defaults
  const srcDirectoryPath = existingArgs.srcDirectoryPath || "./src";
  const artifactDirectoryPath = existingArgs.artifactDirectoryPath || undefined;

  // todo: use the src directory as base once configurable
  const schemaFilePath = existingArgs.schemaFilePath || "./schema.graphql";

  const ignoreGitChanges = existingArgs.ignoreGitChanges || false;
  const skipPrompts = existingArgs.skipPrompts || false;

  return {
    packageManager,
    toolChain,
    useTypescript,
    schemaFilePath,
    srcDirectoryPath,
    artifactDirectoryPath,
    ignoreGitChanges,
    skipPrompts,
  };
}

export async function getProjectToolChain(
  manager: PackageManager,
  projectRootDirectory: string
): Promise<ToolChain> {
  if (await isNpmPackageInstalled(manager, projectRootDirectory, "next")) {
    return "next";
  }

  if (await isNpmPackageInstalled(manager, projectRootDirectory, "vite")) {
    return "vite";
  }

  return "cra";
}

export async function getProjectPackageManager(
  projectRootDirectory: string
): Promise<PackageManager> {
  try {
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

    try {
      execSync("yarn --version", { stdio: "ignore" });

      const hasLockfile = await findFileInDirectory(
        projectRootDirectory,
        "yarn.lock"
      );

      if (hasLockfile) {
        // Yarn is installed and the project contains a yarn.lock file.
        return "yarn";
      }
    } catch {
      execSync("pnpm --version", { stdio: "ignore" });

      const hasLockfile = await findFileInDirectory(
        projectRootDirectory,
        "pnpm-lock.yaml"
      );

      if (hasLockfile) {
        // pnpm is installed and the project contains a pnpm-lock.yml file.
        return "pnpm";
      }
    }
  } catch {}

  return "npm";
}
