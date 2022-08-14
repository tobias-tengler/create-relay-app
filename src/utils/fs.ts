import glob from "glob";
import path from "path";
import fs from "fs/promises";
import fsExtra from "fs-extra";
import { existsSync } from "fs";

export function copyFile(src: string, dest: string): Promise<void> {
  return fs.copyFile(src, dest);
}

export function doesExist(filepath: string): boolean {
  return existsSync(filepath);
}

export function readFromFile(filepath: string): Promise<string> {
  return fs.readFile(filepath, "utf-8");
}

export function writeToFile(filepath: string, content: string): Promise<void> {
  return fs.writeFile(filepath, content, "utf-8");
}

export function createDirectory(directoryPath: string): Promise<void> {
  return fsExtra.mkdir(directoryPath, { recursive: true });
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

export function isSubDirectory(parent: string, dir: string): boolean {
  const relative = path.relative(parent, dir);

  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function normalizePath(input: string): string {
  return input.split(path.sep).join("/");
}

export function removeExtension(filename: string): string {
  return filename.substring(0, filename.lastIndexOf(".")) || filename;
}

export function prettifyRelativePath(
  parentPath: string,
  childPath: string
): string {
  const relativePath = path.relative(parentPath, childPath);

  return prettifyPath(relativePath);
}

export function prettifyPath(input: string): string {
  let normalizedPath = normalizePath(input);

  if (!normalizedPath.startsWith("..") && !normalizedPath.startsWith("./")) {
    normalizedPath = "./" + normalizedPath;
  }

  return normalizedPath;
}
