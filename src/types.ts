import { RelativePath } from "./misc/RelativePath.js";

export const ToolchainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type ToolchainType = typeof ToolchainOptions[number];
export type PackageManagerType = typeof PackageManagerOptions[number];

export type RelayCompilerLanguage = "javascript" | "typescript" | "flow";

export type CliArguments = {
  toolchain: ToolchainType;
  typescript: boolean;
  withSubscriptions: boolean;
  schemaFile: string;
  src: string;
  artifactDirectory: string;
  packageManager: PackageManagerType;
  ignoreGitChanges: boolean;
  skipInstall: boolean;
  yes: boolean;
};
