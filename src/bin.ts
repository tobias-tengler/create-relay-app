#!/usr/bin/env node

import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";

async function hasUnsavedGitChanges(dir: string): Promise<boolean> {
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

async function findPackageJsonFile(dir: string): Promise<string | null> {
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

const workDir = process.cwd();

const packageJsonFile = await findPackageJsonFile(workDir);

if (!packageJsonFile) {
  // package.json file is missing.
  throw new Error("package.json file is missing");
}

const projectDir = path.dirname(packageJsonFile);

const hasUnsavedChanges = await hasUnsavedGitChanges(projectDir);

if (hasUnsavedChanges) {
  throw new Error("Project has unsaved changes");
}

export {};
