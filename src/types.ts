export const ToolchainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type Toolchain = typeof ToolchainOptions[number];
export type PackageManager = typeof PackageManagerOptions[number];

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
  workingDirectory: string;
  ownPackageDirectory: string;
  projectRootDirectory: string;
  packageJsonFile: string;
}>;

export type ProjectSettings = Readonly<
  CliArguments &
    EnvArguments & {
      compilerLanguage: "javascript" | "typescript";
      relayEnvFilepath: string;
      configFilepath: string;
      mainFilepath: string;
    }
>;
