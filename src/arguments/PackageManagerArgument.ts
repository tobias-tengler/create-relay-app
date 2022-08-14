import { Command } from "commander";
import { inferPackageManager } from "../helpers.js";
import { PackageManager, PackageManagerOptions } from "../types.js";
import { ArgumentBase, getNormalizedCliString } from "./ArgumentBase.js";

export class PackageManagerArgument extends ArgumentBase<"packageManager"> {
  public name = "packageManager" as const;

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("p", "<manager>");

    command.option(
      flags,
      "the package manager to use for installing packages",
      this.parsePackageManager
    );
  }

  promptForValue(): Promise<PackageManager> {
    return this.showInquirerPrompt({
      message: "Select the package manager to install packages with",
      type: "list",
      choices: PackageManagerOptions,
    });
  }

  async getDefaultValue(): Promise<PackageManager> {
    try {
      const inferred = inferPackageManager();

      // If we have the default package manager,
      // we do another round of checks on the project directory.
      //   if (inferred === "npm") {
      //     try {
      //       execSync("yarn --version", { stdio: "ignore" });

      //       const hasLockfile = await findFileInDirectory(
      //         projectRootDirectory,
      //         "yarn.lock"
      //       );

      //       if (hasLockfile) {
      //         // Yarn is installed and the project contains a yarn.lock file.
      //         return "yarn";
      //       }
      //     } catch {
      //       execSync("pnpm --version", { stdio: "ignore" });

      //       const hasLockfile = await findFileInDirectory(
      //         projectRootDirectory,
      //         "pnpm-lock.yaml"
      //       );

      //       if (hasLockfile) {
      //         // pnpm is installed and the project contains a pnpm-lock.yml file.
      //         return "pnpm";
      //       }
      //     }
      //   }
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
