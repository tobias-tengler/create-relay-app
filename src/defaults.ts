import { execSync } from "child_process";
import path from "path";
import { findFileInDirectory, prettifyPath } from "./helpers.js";
import {
  CliArguments,
  EnvArguments,
  PackageManager,
  Toolchain,
} from "./types.js";
import {
  doesProjectUseTypescript,
  isNpmPackageInstalled,
} from "./validation.js";

export async function getDefaultCliArguments(
  existing: Partial<CliArguments>,
  env: EnvArguments
): Promise<CliArguments> {
  const packageManager =
    existing.packageManager ||
    (await getProjectPackageManager(env.projectRootDirectory));

  const toolchain =
    existing.toolchain ||
    (await getProjectToolchain(packageManager, env.projectRootDirectory));

  const typescript =
    existing.typescript ||
    (await doesProjectUseTypescript(env.projectRootDirectory, packageManager));

  const src = existing.src || getProjectSrcDirectory(toolchain);
  const artifactDirectory =
    existing.artifactDirectory || getProjectArtifactDirectory(toolchain);

  const schemaFile =
    existing.schemaFile || getProjectSchemaFilepath(toolchain, src);

  const ignoreGitChanges = existing.ignoreGitChanges || false;
  const yes = existing.yes || false;

  return {
    packageManager,
    toolchain,
    typescript,
    schemaFile,
    src,
    artifactDirectory,
    ignoreGitChanges,
    yes,
  };
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

export function getProjectSchemaFilepath(
  toolchain: Toolchain,
  srcDirectoryPath: string
): string {
  const filename = "schema.graphql";

  let srcPath: string = srcDirectoryPath;

  if (toolchain === "next") {
    srcPath = "src";
  }

  return prettifyPath(path.join(srcPath, filename));
}

function getProjectArtifactDirectory(toolchain: Toolchain): string {
  if (toolchain === "next") {
    // Artifacts need to be located outside the ./pages directory,
    // or they will be treated as pages.
    return "./__generated__";
  }

  return "";
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

export async function getProjectPackageManager(
  projectRootDirectory?: string
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

    if (projectRootDirectory) {
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
    }
  } catch {}

  return "npm";
}
