import { Command } from "commander";
import {
  CliArguments,
  EnvArguments,
  Toolchain,
  ToolchainOptions,
} from "../types.js";
import { isNpmPackageInstalled } from "../utils/index.js";
import { ArgumentBase, getNormalizedCliString } from "./ArgumentBase.js";

export class ToolchainArgument extends ArgumentBase<"toolchain"> {
  public name = "toolchain" as const;

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
        message: "Select the toolchain your project was setup with",
        type: "list",
        choices: ToolchainOptions,
      },
      existingArgs,
      env
    );
  }

  async getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<Toolchain> {
    if (
      await isNpmPackageInstalled(
        env.launcher,
        env.projectRootDirectory,
        "next"
      )
    ) {
      return "next";
    }

    if (
      await isNpmPackageInstalled(
        env.launcher,
        env.projectRootDirectory,
        "vite"
      )
    ) {
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
