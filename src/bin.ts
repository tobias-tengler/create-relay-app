#!/usr/bin/env node

import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import inquirer from "inquirer";

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

function getPackageManagerToUse(): PackageManager {
  const defaultPackageManager = "npm";

  const userAgent = process.env.npm_config_user_agent;

  if (!userAgent) {
    return defaultPackageManager;
  }

  const packageManager = userAgent.split(" ")[0]?.split("/")[0];

  if (packageManager !== "yarn" && packageManager !== "npm") {
    // todo: how to handle this better
    throw new Error("Only `yarn` and `npm` are supported package managers");
  }

  return packageManager || defaultPackageManager;
}

function getAddPackagesCommand(
  manager: PackageManager,
  packages: string[],
  devDep: boolean
): string {
  const managerCmd = manager === "yarn" ? "add" : "install";
  const packagesString = packages.join(" ");

  let command = `${manager} ${managerCmd} ${packagesString} `;

  if (devDep) {
    command += manager === "npm" ? "--save-dev" : "-D";
  }

  return command.trim();
}

function addPackages(
  manager: PackageManager,
  workDir: string,
  packages: string[],
  devDep: boolean
): Promise<void> {
  const command = getAddPackagesCommand(manager, packages, devDep);

  console.log({ command });

  return Promise.resolve();

  //   return new Promise((resolve, reject) => {
  //     exec(command, { cwd: workDir }, (error) => {
  //       if (!!error) {
  //         reject(error);
  //       } else {
  //         resolve();
  //       }
  //     });
  //   });
}

function getCompilerLanguage(
  language: ProjectLanguage
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

const toolchainChoices = ["Create-React-App", "Next.js", "Vite"] as const;
const compilerLanguageChoices = ["Typescript", "JavaScript", "Flow"] as const;
const packageManagerChoices = ["npm", "yarn"] as const;

const relayDep = ["react-relay"];
const relayDevDep = ["relay-compiler"];
const relayTypeScriptDep = ["@types/react-relay", "@types/relay-runtime"];

type ToolChain = typeof toolchainChoices[number];
type ProjectLanguage = typeof compilerLanguageChoices[number];
type PackageManager = typeof packageManagerChoices[number];

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

// todo: handle artifact directory
// todo: handle error
const answers = await inquirer.prompt<{
  toolchain: ToolChain;
  language: ProjectLanguage;
  packageManager: PackageManager;
}>([
  {
    name: "toolchain",
    message: "Select the toolchain your project is using",
    type: "list",
    default: 0,
    choices: toolchainChoices,
  },
  {
    name: "language",
    message: "Select the language of your project",
    type: "list",
    default: 0,
    choices: compilerLanguageChoices,
  },
  {
    name: "packageManager",
    message: "Select the package manager you wish to use to install packages",
    type: "list",
    default: () => getPackageManagerToUse(),
    choices: packageManagerChoices,
  },
]);

// INSTALL PACKAGES

const dependencies = [...relayDep];
let devDependencies = [...relayDevDep];

if (answers.toolchain === "Create-React-App") {
  devDependencies = devDependencies.concat(["babel-plugin-relay", "graphql"]);
} else if (answers.toolchain === "Vite") {
  devDependencies.push("vite-plugin-relay");
}

if (answers.language === "Typescript") {
  devDependencies = devDependencies.concat(relayTypeScriptDep);
}

await addPackages(answers.packageManager, projectDir, dependencies, false);
await addPackages(answers.packageManager, projectDir, devDependencies, true);

// ADD RELAY CONFIG

// todo: handle error
const packageJsonContent = await fs.readFile(packageJsonFile, {
  encoding: "utf-8",
});
const parsedConfig = JSON.parse(packageJsonContent);

const compilerLanguage = getCompilerLanguage(answers.language);

const scriptsSection = parsedConfig["scripts"] ?? {};

scriptsSection["relay"] = "relay-compiler";

parsedConfig["scripts"] = scriptsSection;

parsedConfig["relay"] = {
  // todo: this should probably be different for the Next.js project
  src: "./src",
  language: compilerLanguage,
  schema: "./src/schema.graphql",
  exclude: ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"],
};

const serializedConfig = JSON.stringify(parsedConfig);

// todo: handle error
await fs.writeFile(packageJsonFile, serializedConfig, "utf-8");

// todo: at the end show next steps with 'replace host in relayenvironment' and 'replace schema.graphql file'.

export {};
