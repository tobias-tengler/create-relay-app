export const ToolchainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type ToolchainType = typeof ToolchainOptions[number];
export type PackageManagerType = typeof PackageManagerOptions[number];

export type RelayCompilerLanguage = "javascript" | "typescript" | "flow";

export type PackageDetails = Readonly<{
  name: string;
  version: string;
  description: string;
  // parentDirectory: string;
  // jsonFile: string;
}>;

export type CliArguments = {
  toolchain: ToolchainType;
  typescript: boolean;
  schemaFile: string;
  src: string;
  artifactDirectory: string;
  packageManager: PackageManagerType;
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
