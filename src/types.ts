export const ToolChainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type ToolChain = typeof ToolChainOptions[number];
export type PackageManager = typeof PackageManagerOptions[number];

export type CliArguments = Readonly<{
  toolChain: ToolChain;
  useTypescript: boolean;
  schemaFilePath: string;
  packageManager: PackageManager;
  ignoreGitChanges: boolean;
  skipPrompts: boolean;
}>;

export type EnvArguments = Readonly<{
  workingDirectory: string;
  ownPackageDirectory: string;
  projectRootDirectory: string;
  packageJsonFile: string;
}>;

export type ProjectSettings = Readonly<
  CliArguments &
    EnvArguments & {
      srcDirectory: string;
    }
>;
