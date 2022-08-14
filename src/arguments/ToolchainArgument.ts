import { Command } from "commander";
import { Toolchain, ToolchainOptions } from "../types.js";
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

  promptForValue(): Promise<Toolchain> {
    return this.showInquirerPrompt({
      message: "Select the toolchain your project was setup with",
      type: "list",
      choices: ToolchainOptions,
    });
  }

  async getDefaultValue(): Promise<Toolchain> {
    // todo: implement isNpmPackageInstalled to look in the packagejson

    // if (await isNpmPackageInstalled(manager, projectRootDirectory, "next")) {
    //   return "next";
    // }

    // if (await isNpmPackageInstalled(manager, projectRootDirectory, "vite")) {
    //   return "vite";
    // }

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
