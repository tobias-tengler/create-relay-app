#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import inquirer from "inquirer";
import {
  addNpmPackages,
  getPackageManagerToUse,
  PackageManager,
} from "./packageManager";
import { hasUnsavedGitChanges } from "./git";
import { findPackageJsonFile } from "./files";

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
const packageManagerChoices: readonly PackageManager[] = [
  "npm",
  "yarn",
  "pnpm",
] as const;

const relayDep = ["react-relay"];
const relayDevDep = ["relay-compiler"];
const relayTypeScriptDep = ["@types/react-relay", "@types/relay-runtime"];

type ToolChain = typeof toolchainChoices[number];
type ProjectLanguage = typeof compilerLanguageChoices[number];

const workDir = process.cwd();

// FIND package.json file

const packageJsonFile = await findPackageJsonFile(workDir);

if (!packageJsonFile) {
  // package.json file is missing.
  throw new Error("package.json file is missing");
}

const projectDir = path.dirname(packageJsonFile);

// CHECK REPO FOR UNSAVED CHANGES

const hasUnsavedChanges = await hasUnsavedGitChanges(projectDir);

if (hasUnsavedChanges) {
  throw new Error("Project has unsaved changes");
}

// ASK FOR PROJECT SETTINGS

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

await addNpmPackages(answers.packageManager, projectDir, dependencies, false);
await addNpmPackages(answers.packageManager, projectDir, devDependencies, true);

// ADD RELAY CONFIG

// todo: handle error
const packageJsonContent = await fs.readFile(packageJsonFile, {
  encoding: "utf-8",
});
const packageJson = JSON.parse(packageJsonContent);

const compilerLanguage = getCompilerLanguage(answers.language);

const scriptsSection = packageJson["scripts"] ?? {};

scriptsSection["relay"] = "relay-compiler";

packageJson["scripts"] = scriptsSection;

packageJson["relay"] = {
  // todo: this should probably be different for the Next.js project
  src: "./src",
  language: compilerLanguage,
  schema: "./src/schema.graphql",
  exclude: ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"],
};

const serializedPackageJson = JSON.stringify(packageJson);

// todo: handle error
await fs.writeFile(packageJsonFile, serializedPackageJson, "utf-8");

// todo: wire up plugins

// todo: at the end show next steps with 'replace host in relayenvironment' and 'replace schema.graphql file'.

export {};
