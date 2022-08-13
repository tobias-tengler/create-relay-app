import path from "path";
import fs from "fs/promises";
import { EnvArguments, Optional, Toolchain } from "./types.js";
import {
  BABEL_RELAY_PACKAGE,
  PACKAGE_FILE,
  VITE_RELAY_PACKAGE,
} from "./consts.js";
import glob from "glob";
import chalk from "chalk";

export function printError(message: string) {
  console.log(chalk.red("✖") + " " + message);
}

export function getRelayCompilerLanguage(
  useTypescript: boolean
): "typescript" | "javascript" {
  if (useTypescript) {
    return "typescript";
  } else {
    return "javascript";
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

type PackageDetails = Readonly<{
  name: string;
  version: string;
  description: string;
}>;

export async function getPackageDetails(
  env: EnvArguments
): Promise<PackageDetails> {
  const ownPackageJsonFile = path.join(env.ownPackageDirectory, PACKAGE_FILE);

  const packageJsonContent = await fs.readFile(ownPackageJsonFile, "utf8");

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

export function getRelayDevDependencies(
  toolchain: Toolchain,
  useTypescript: boolean
) {
  const relayDevDep = ["relay-compiler"];

  if (useTypescript) {
    relayDevDep.push("@types/react-relay");
    relayDevDep.push("@types/relay-runtime");
  }

  if (toolchain === "cra" || toolchain === "vite") {
    relayDevDep.push(BABEL_RELAY_PACKAGE);
  }

  if (toolchain === "vite") {
    relayDevDep.push(VITE_RELAY_PACKAGE);
  }

  return relayDevDep;
}

export function getSpecifiedProperties<T extends object>(obj: Optional<T>): T {
  const keys = Object.keys(obj) as (keyof T)[];

  const newObj = {} as T;

  for (const key of keys) {
    if (obj[key] === null) {
      continue;
    }

    newObj[key] = obj[key]!;
  }

  return newObj;
}
