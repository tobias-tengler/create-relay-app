export const ToolChainOptions = [
  "Create-React-App",
  "Next.js",
  "Vite",
] as const;
export const LanguageOptions = ["Typescript", "JavaScript", "Flow"] as const;
export const PackageManagerOptions = ["npm", "yarn", "pnpm"] as const;

export type ToolChain = typeof ToolChainOptions[number];
export type ProjectLanguage = typeof LanguageOptions[number];
export type PackageManager = typeof PackageManagerOptions[number];

export type ProjectSettings = {
  toolchain: ToolChain;
  language: ProjectLanguage;
  schemaFilePath: string;
  packageManager: PackageManager;
};
