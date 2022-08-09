import { exec, execSync } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { PackageManager } from "./types.js";

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

export async function findPackageJsonFile(dir: string): Promise<string | null> {
  const packageJsonFile = "package.json";

  let curDir = dir;
  let prevDir: string | null = null;

  while (!!curDir) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const filepath = await findFileInDirectory(packageJsonFile, curDir);

    if (!!filepath) {
      return filepath;
    }

    prevDir = curDir;
    curDir = path.join(curDir, "..");

    if (prevDir === curDir) {
      // We reached the root.
      break;
    }
  }

  return null;
}
async function findFileInDirectory(
  searchedFilename: string,
  dir: string
): Promise<string | null> {
  try {
    const filenames = await fs.readdir(dir);

    for (const filename of filenames) {
      if (filename === searchedFilename) {
        const filepath = path.join(dir, filename);

        return filepath;
      }
    }
  } catch {}

  return null;
}
