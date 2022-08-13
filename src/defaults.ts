import { execSync } from "child_process";
import path from "path";
import { findFileInDirectory, normalizePath } from "./helpers.js";
import {
  CliArguments,
  EnvArguments,
  Optional,
  PackageManager,
  Toolchain,
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

  const toolchain =
    existingArgs.toolchain ||
    (await getProjectToolchain(packageManager, env.projectRootDirectory));

  const useTypescript =
    existingArgs.useTypescript ||
    (await doesProjectUseTypescript(env.projectRootDirectory, packageManager));

  const srcDirectoryPath =
    existingArgs.srcDirectoryPath || getProjectSrcDirectory(toolchain);
  const artifactDirectoryPath =
    existingArgs.artifactDirectoryPath ||
    getProjectArtifactDirectory(toolchain);

  const schemaFilePath =
    existingArgs.schemaFilePath ||
    getProjectSchemaFilepath(toolchain, srcDirectoryPath);

  const ignoreGitChanges = existingArgs.ignoreGitChanges || false;
  const skipPrompts = existingArgs.skipPrompts || false;

  return {
    packageManager,
    toolchain: toolchain,
    useTypescript,
    schemaFilePath,
    srcDirectoryPath,
    artifactDirectoryPath,
    ignoreGitChanges,
    skipPrompts,
  };
}

export function getProjectSchemaFilepath(
  toolchain: Toolchain,
  srcDirectoryPath: string
): string {
  const filename = "schema.graphql";

  if (toolchain === "next") {
    return filename;
  }

  return normalizePath(path.join(srcDirectoryPath, filename));
}

function getProjectArtifactDirectory(toolchain: Toolchain): string | undefined {
  if (toolchain === "next") {
    // Artifacts need to be located outside the ./pages directory,
    // or they will be treated as pages.
    return "./__generated__";
  }

  return undefined;
}

function getProjectSrcDirectory(toolchain: Toolchain): string {
  if (toolchain === "next") {
    return "./pages";
  }

  return "./src";
}

async function getProjectToolchain(
  manager: PackageManager,
  projectRootDirectory: string
): Promise<Toolchain> {
  if (await isNpmPackageInstalled(manager, projectRootDirectory, "next")) {
    return "next";
  }

  if (await isNpmPackageInstalled(manager, projectRootDirectory, "vite")) {
    return "vite";
  }

  return "cra";
}

async function getProjectPackageManager(
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
