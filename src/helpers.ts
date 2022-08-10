import { exec, execSync, spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { CodeLanguage, PackageManager, ToolChain } from "./types.js";
import {
  FLOW_PACKAGE,
  NEXTJS_CONFIG_FILE,
  TS_CONFIG_FILE,
  TYPESCRIPT_PACKAGE,
} from "./consts.js";
import glob from "glob";

export function getRelayCompilerLanguage(
  language: CodeLanguage
): "typescript" | "flow" | "javascript" {
  switch (language) {
    case "Typescript":
      return "typescript";
    case "Flow":
      return "flow";
    default:
      return "javascript";
  }
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

export async function getProjectToolChain(
  workingDirectory: string,
  manager: PackageManager
): Promise<ToolChain> {
  const nextjsConfigFile = await findFileInDirectory(
    workingDirectory,
    NEXTJS_CONFIG_FILE
  );

  if (!!nextjsConfigFile) {
    return "Next.js";
  }

  const viteConfigFiles = await searchFilesInDirectory(
    workingDirectory,
    "vite.config.*"
  );

  if (viteConfigFiles.some((f) => !!f)) {
    return "Vite";
  }

  return "Create-React-App";
}

export async function getProjectLanguage(
  workingDirectory: string,
  manager: PackageManager
): Promise<CodeLanguage> {
  const tsconfigFile = await findFileInDirectory(
    workingDirectory,
    TS_CONFIG_FILE
  );

  if (!!tsconfigFile) {
    return "Typescript";
  }

  const typescriptInstalled = await isNpmPackageInstalled(
    manager,
    workingDirectory,
    TYPESCRIPT_PACKAGE
  );

  if (typescriptInstalled) {
    return "Typescript";
  }

  const flowInstalled = await isNpmPackageInstalled(
    manager,
    workingDirectory,
    FLOW_PACKAGE
  );

  if (flowInstalled) {
    return "Flow";
  }

  return "JavaScript";
}

export async function isNpmPackageInstalled(
  manager: PackageManager,
  workingDirectory: string,
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
      cwd: workingDirectory,
      env: process.env,
      shell: true,
    });

    child.stdout.on("data", (data) => {
      const stringData = data.toString() as string;

      if (stringData.includes(packageName)) {
        resolve(true);
      }
    });

    child.on("close", () => {
      resolve(false);
    });
  });
}

export function getPackageManagerToUse(): PackageManager {
  try {
    const userAgent = process.env.npm_config_user_agent;

    if (userAgent) {
      if (userAgent.startsWith("yarn")) {
        return "yarn";
      } else if (userAgent.startsWith("pnpm")) {
        return "pnpm";
      }
    }

    try {
      execSync("yarn --version", { stdio: "ignore" });

      return "yarn";
    } catch {
      execSync("pnpm --version", { stdio: "ignore" });

      return "pnpm";
    }
  } catch {
    return "npm";
  }
}

export async function traverseUpToFindFile(
  directory: string,
  filename: string
): Promise<string | null> {
  let currentDirectory = directory;
  let previousDirectory: string | null = null;

  while (!!currentDirectory) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const filepath = await findFileInDirectory(currentDirectory, filename);

    if (!!filepath) {
      return filepath;
    }

    previousDirectory = currentDirectory;
    currentDirectory = path.join(currentDirectory, "..");

    if (previousDirectory === currentDirectory) {
      // We reached the root.
      break;
    }
  }

  return null;
}

export async function findFileInDirectory(
  directory: string,
  filename: string
): Promise<string | null> {
  try {
    const filenames = await fs.readdir(directory);

    for (const name of filenames) {
      if (name === filename) {
        const filepath = path.join(directory, filename);

        return filepath;
      }
    }
  } catch {}

  return null;
}

export async function searchFilesInDirectory(
  directory: string,
  pattern: string
): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      glob(pattern, { cwd: directory }, (error, matches) => {
        if (error || !matches || !matches.some((m) => !!m)) {
          resolve([]);
        } else {
          resolve(matches);
        }
      });
    } catch {
      resolve([]);
    }
  });
}
