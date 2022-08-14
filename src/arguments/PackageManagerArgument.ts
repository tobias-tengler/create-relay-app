import { execSync } from "child_process";
import { Command } from "commander";
import {
  CliArguments,
  EnvArguments,
  PackageManager,
  PackageManagerOptions,
} from "../types.js";
import { findFileInDirectory, inferPackageManager } from "../utils/index.js";
import { ArgumentBase, getNormalizedCliString } from "./ArgumentBase.js";

export class PackageManagerArgument extends ArgumentBase<"packageManager"> {
  public name = "packageManager" as const;
  public promptMessage = "Select the package manager to install packages with";

  registerCliOption(command: Command): void {
    // todo: should be --package-manager
    const flags = this.getCliFlags("p", "<manager>");

    command.option(
      flags,
      "the package manager to use for installing packages",
      this.parsePackageManager
    );
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<PackageManager> {
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
    value: PackageManager,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<PackageManager> {
    try {
      const inferred = inferPackageManager();

      // If we have the default package manager,
      // we do another round of checks on the project directory.
      if (inferred === "npm") {
        try {
          execSync("yarn --version", { stdio: "ignore" });

          const hasLockfile = await findFileInDirectory(
            env.projectRootDirectory,
            "yarn.lock"
          );

          if (hasLockfile) {
            // Yarn is installed and the project contains a yarn.lock file.
            return "yarn";
          }
        } catch {
          execSync("pnpm --version", { stdio: "ignore" });

          const hasLockfile = await findFileInDirectory(
            env.projectRootDirectory,
            "pnpm-lock.yaml"
          );

          if (hasLockfile) {
            // pnpm is installed and the project contains a pnpm-lock.yml file.
            return "pnpm";
          }
        }
      }
    } catch {}

    return "npm";
  }

  parsePackageManager(rawInput?: string): PackageManager | null {
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
