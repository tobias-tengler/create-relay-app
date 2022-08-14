import { Command } from "commander";
import {
  CliArguments,
  EnvArguments,
  Toolchain,
  ToolchainOptions,
} from "../types.js";
import {
  isNpmPackageDependency,
  isNpmPackageInstalled,
} from "../utils/index.js";
import { ArgumentBase, getNormalizedCliString } from "./ArgumentBase.js";

export class ToolchainArgument extends ArgumentBase<"toolchain"> {
  public name = "toolchain" as const;
  public promptMessage = "Select the toolchain your project was setup with";

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags("-t", "<toolchain>");

    command.option(
      flags,
      "the toolchain used to bundle / serve the project",
      this.parseToolChain
    );
  }

  promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<Toolchain> {
    return this.showInquirerPrompt(
      {
        type: "list",
        choices: ToolchainOptions,
      },
      existingArgs,
      env
    );
  }

  isValid(
    value: Toolchain,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string {
    return true;
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<Toolchain> {
    if (await isNpmPackageDependency(env.packageJsonFile, "next")) {
      return "next";
    }

    if (await isNpmPackageDependency(env.packageJsonFile, "vite")) {
      return "vite";
    }

    return "cra";
  }

  parseToolChain(rawInput?: string): Toolchain | null {
    if (!rawInput) {
      return null;
    }

    const input = getNormalizedCliString(rawInput);

    if (input === "next") {
      return "next";
    }

    if (input === "vite") {
      return "vite";
    }

    if (input === "cra") {
      return "cra";
    }

    throw this.getInvalidArgError(input, ToolchainOptions);
  }
}
