export type Optional<T> = {
  [key in keyof T]: T[key] | null;
};

export const ToolchainOptions = ["cra", "next", "vite"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type Toolchain = typeof ToolchainOptions[number];
export type PackageManager = typeof PackageManagerOptions[number];

export type CliArguments = Readonly<{
  toolchain: Toolchain;
  useTypescript: boolean;
  schemaFilePath: string;
  srcDirectoryPath: string;
  artifactDirectoryPath: string | undefined;
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

export type ViteToolchainSettings = {
  toolchain: "vite";
  configFilepath: string;
  mainFilepath: string;
};

export type NextToolchainSettings = {
  toolchain: "next";
  configFilepath: string;
  appFilepath: string;
};

export type ToolchainSettings = Readonly<
  (ViteToolchainSettings | NextToolchainSettings) & { toolchain: Toolchain }
>;

export function isViteSettings(
  settings: ToolchainSettings
): settings is ViteToolchainSettings {
  return settings.toolchain === "vite";
}

export function isNextSettings(
  settings: ToolchainSettings
): settings is NextToolchainSettings {
  return settings.toolchain === "next";
}

export type ProjectSettings = Readonly<
  CliArguments &
    EnvArguments & {
      compilerLanguage: "javascript" | "typescript";
      relayEnvFilepath: string;
      toolchainSettings: ToolchainSettings;
    }
>;
