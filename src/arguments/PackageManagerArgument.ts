import { execSync } from "child_process";
import { Command } from "commander";
import path from "path";
import { inferPackageManager } from "../packageManagers/index.js";
import {
  CliArguments,
  EnvArguments,
  PackageManagerType,
  PackageManagerOptions,
} from "../types.js";
import { doesExist } from "../utils/fs.js";
import { ArgumentBase, getNormalizedCliString } from "./ArgumentBase.js";

export class PackageManagerArgument extends ArgumentBase<"packageManager"> {
  public name = "packageManager" as const;
  public promptMessage = "Select the package manager to install packages with";

  constructor() {
    super();
    this.cliArg = "--package-manager";
  }

  registerCliOption(command: Command, env: EnvArguments): void {
    const flags = this.getCliFlags("-p", "<manager>");

    command.option(
      flags,
      "the package manager to use for installing packages",
      this.parsePackageManager
    );
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<PackageManagerType> {
    return this.showInquirerPrompt(
      {
        type: "list",
        choices: PackageManagerOptions,
      },
      existingArgs,
      env
    );
  }

  isValid(
    value: PackageManagerType,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<PackageManagerType> {
    try {
      const inferred = inferPackageManager();

      // If we have the default package manager,
      // we do another round of checks on the project directory.
      if (inferred === "npm") {
        try {
          execSync("yarn --version", { stdio: "ignore" });

          const lockFile = path.join(env.projectRootDirectory, "yarn.lock");

          if (doesExist(lockFile)) {
            // Yarn is installed and the project contains a yarn.lock file.
            return "yarn";
          }
        } catch {
          execSync("pnpm --version", { stdio: "ignore" });

          const lockFile = path.join(
            env.projectRootDirectory,
            "pnpm-lock.yaml"
          );

          if (doesExist(lockFile)) {
            // pnpm is installed and the project contains a pnpm-lock.yml file.
            return "pnpm";
          }
        }
      }
    } catch {}

    return "npm";
  }

  parsePackageManager(rawInput?: string): PackageManagerType | null {
    if (!rawInput) {
      return null;
    }

    const input = getNormalizedCliString(rawInput);

    if (input === "yarn") {
      return "yarn";
    }

    if (input === "pnpm") {
      return "pnpm";
    }

    if (input === "npm") {
      return "npm";
    }

    throw this.getInvalidArgError(input, PackageManagerOptions);
  }
}
