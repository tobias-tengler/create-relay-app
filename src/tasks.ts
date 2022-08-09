import { existsSync, promises as fs } from "fs";
import inquirer from "inquirer";
import { addNpmPackages, getPackageManagerToUse } from "./packageManager";
import {
  ProjectLanguage,
  ToolChain,
  PackageManager,
  LanguageOptions,
  PackageManagerOptions,
  ToolChainOptions,
} from "./types";

type ProjectSettings = {
  toolchain: ToolChain;
  language: ProjectLanguage;
  schemaFilePath: string;
  packageManager: PackageManager;
};

export async function inquireProjectSettings(): Promise<ProjectSettings> {
  const defaultPackageManager = getPackageManagerToUse();

  // todo: handle artifact directory
  // todo: handle error
  return await inquirer.prompt<ProjectSettings>([
    {
      name: "toolchain",
      message: "Select the toolchain your project is using",
      type: "list",
      default: 0, // todo: try to infer the correct value
      choices: ToolChainOptions,
    },
    {
      name: "language",
      message: "Select the language of your project",
      type: "list",
      default: 0, // todo: try to infer the correct value
      choices: LanguageOptions,
    },
    {
      // todo: validate that it's inside project dir and ends in .graphql
      name: "schemaFilePath",
      message: "Select the path to your GraphQL schema file",
      type: "input",
      default: "./src/schema.graphql",
    },
    {
      name: "packageManager",
      message: "Select the package manager you wish to use to install packages",
      type: "list",
      default: defaultPackageManager,
      choices: PackageManagerOptions,
    },
  ]);
}

export async function installRelayDependencies(
  packageManager: PackageManager,
  projectDir: string,
  toolchain: ToolChain,
  language: ProjectLanguage
) {
  const relayDep = ["react-relay"];
  let relayDevDep = ["relay-compiler"];

  if (toolchain === "Create-React-App") {
    relayDevDep = relayDevDep.concat(["babel-plugin-relay", "graphql"]);
  } else if (toolchain === "Vite") {
    // todo: check on maintainance status and if it actually works
    relayDevDep.push("vite-plugin-relay");
  }

  if (language === "Typescript") {
    relayDevDep = relayDevDep.concat([
      "@types/react-relay",
      "@types/relay-runtime",
    ]);
  }

  // Add dependencies
  await addNpmPackages(packageManager, projectDir, relayDep, false);

  // Add devDependencies
  await addNpmPackages(packageManager, projectDir, relayDevDep, true);
}

export async function addRelayConfig(
  packageJsonFile: string,
  language: ProjectLanguage,
  schemaFilePath: string
) {
  const compilerLanguage = getCompilerLanguage(language);

  // todo: handle error
  const packageJsonContent = await fs.readFile(packageJsonFile, {
    encoding: "utf-8",
  });

  const packageJson = JSON.parse(packageJsonContent);

  const scriptsSection = packageJson["scripts"] ?? {};

  if (!scriptsSection["relay"]) {
    // Add "relay" script
    scriptsSection["relay"] = "relay-compiler";

    packageJson["scripts"] = scriptsSection;
  }

  if (!packageJson["relay"]) {
    // Add "relay" configuration section
    packageJson["relay"] = {
      // todo: this should probably be different for the Next.js project
      src: "./src",
      language: compilerLanguage,
      schema: schemaFilePath,
      exclude: ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"],
    };
  }

  const serializedPackageJson = JSON.stringify(packageJson);

  // todo: handle error
  await fs.writeFile(packageJsonFile, serializedPackageJson, "utf-8");
}

export async function addRelayPluginConfiguration() {}

export async function addGraphQLSchemaFile(schemaFilePath: string) {
  if (!existsSync(schemaFilePath)) {
    // Add a default GraphQL schema file to satisfy the compiler
    const schemaGraphQLContent = `# Replace this with your own GraphQL schema file!\ntype Query {\n  field: String\n}`;

    await fs.writeFile(schemaFilePath, schemaGraphQLContent, "utf-8");
  }
}

export async function addRelayEnvironment() {}

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
