import { exec, execSync, spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { PackageManager, ToolChain } from "./types.js";
import { TS_CONFIG_FILE, TYPESCRIPT_PACKAGE } from "./consts.js";
import glob from "glob";
import { ParseResult } from "@babel/parser";
import t from "@babel/types";
import { parse } from "@babel/parser";
import generate from "@babel/generator";
import { format } from "prettier";
import chalk from "chalk";
import { NodePath } from "@babel/traverse";

export function printError(message: string) {
  console.log(chalk.red("✖") + " " + message);
}

export function insertNamedImport(
  path: NodePath,
  importName: string,
  packageName: string
): t.Identifier {
  const importIdentifier = t.identifier(importName);

  const program = path.findParent((p) => p.isProgram()) as NodePath<t.Program>;

  const existingImport = program.node.body.find(
    (s) =>
      t.isImportDeclaration(s) &&
      s.source.value === packageName &&
      s.specifiers.some(
        (sp) => t.isImportSpecifier(sp) && sp.local.name === importName
      )
  );

  if (!!existingImport) {
    return importIdentifier;
  }

  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.cloneNode(importIdentifier), importIdentifier)],
    t.stringLiteral(packageName)
  );

  // Insert import at start of file.
  program.node.body.unshift(importDeclaration);

  return importIdentifier;
}

export function parseAst(code: string): ParseResult<t.File> {
  return parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
}

export function printAst(ast: ParseResult<t.File>, oldCode: string): string {
  const newCode = generate.default(ast, { retainLines: true }, oldCode).code;

  return format(newCode, {
    bracketSameLine: false,
    parser: "babel-ts",
  });
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

export async function doesProjectUseTypescript(
  projectRootDirectory: string,
  manager: PackageManager
): Promise<boolean> {
  const tsconfigFile = await findFileInDirectory(
    projectRootDirectory,
    TS_CONFIG_FILE
  );

  if (!!tsconfigFile) {
    return true;
  }

  const typescriptInstalled = await isNpmPackageInstalled(
    manager,
    projectRootDirectory,
    TYPESCRIPT_PACKAGE
  );

  if (typescriptInstalled) {
    return true;
  }

  return false;
}

export async function isNpmPackageInstalled(
  manager: PackageManager,
  projectRootDirectory: string,
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
      cwd: projectRootDirectory,
      env: process.env,
      shell: true,
    });

    child.stdout.on("data", (data) => {
      const stringData = data.toString() as string;

      if (new RegExp(`\x20${packageName}@\\w`, "m").test(stringData)) {
        resolve(true);
      }
    });

    child.on("close", () => {
      resolve(false);
    });
  });
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
