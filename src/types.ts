import { RelativePath } from "./RelativePath.js";

export const ToolchainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type Toolchain = typeof ToolchainOptions[number];
export type PackageManager = typeof PackageManagerOptions[number];

export type RelayCompilerLanguage = "javascript" | "typescript" | "flow";

export type CliArguments = {
  toolchain: Toolchain;
  typescript: boolean;
  // todo: the raw cli arguments should be string, but the settings should be RelativePaths
  schemaFile: RelativePath;
  src: RelativePath;
  artifactDirectory: RelativePath | null;
  packageManager: PackageManager;
  ignoreGitChanges: boolean;
  skipInstall: boolean;
  yes: boolean;
};

export type EnvArguments = Readonly<{
  workingDirectory: string;
  ownPackageDirectory: string;
  ownPackageName: string;
  ownPackageDescription: string;
  ownPackageVersion: string;
  projectRootDirectory: string;
  packageJsonFile: string;
}>;

export type ProjectSettings = Readonly<
  CliArguments &
    EnvArguments & {
      compilerLanguage: RelayCompilerLanguage;
      relayEnvFile: RelativePath;
      configFile: RelativePath;
      mainFile: RelativePath;
    }
>;
