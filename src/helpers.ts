import { exec, execSync } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { CodeLanguage, PackageManager } from "./types.js";

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
