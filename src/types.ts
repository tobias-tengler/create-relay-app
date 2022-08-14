export const ToolchainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type Toolchain = typeof ToolchainOptions[number];
export type PackageManager = typeof PackageManagerOptions[number];

export type RelayCompilerLanguage = "javascript" | "typescript" | "flow";

export type CliArguments = {
  toolchain: Toolchain;
  typescript: boolean;
  schemaFile: string;
  src: string;
  artifactDirectory: string;
  packageManager: PackageManager;
  ignoreGitChanges: boolean;
  yes: boolean;
};

export type EnvArguments = Readonly<{
  launcher: PackageManager;
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
      relayEnvFilepath: string;
      configFilepath: string;
      mainFilepath: string;
    }
>;
