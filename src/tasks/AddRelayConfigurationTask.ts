import { TaskBase } from "../TaskBase.js";
import fs from "fs/promises";
import { ProjectSettings } from "../types.js";
import { getRelayCompilerLanguage } from "../helpers.js";

export class AddRelayConfigurationTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    // todo: handle error
    const packageJsonContent = await fs.readFile(
      this.settings.packageJsonFile,
      {
        encoding: "utf-8",
      }
    );

    const packageJson = JSON.parse(packageJsonContent);

    const scriptsSection = packageJson["scripts"] ?? {};

    if (!scriptsSection["relay"]) {
      // Add "relay" script
      scriptsSection["relay"] = "relay-compiler";

      packageJson["scripts"] = scriptsSection;
    }

    if (!packageJson["relay"]) {
      // Add "relay" configuration section
      packageJson["relay"] = {
        src: this.settings.srcDirectory,
        language: getRelayCompilerLanguage(this.settings.useTypescript),
        schema: this.settings.schemaFilePath,
        exclude: [
          "**/node_modules/**",
          "**/__mocks__/**",
          "**/__generated__/**",
        ],
      };
    }

    const serializedPackageJson = JSON.stringify(packageJson, null, 2);

    // todo: handle error
    await fs.writeFile(
      this.settings.packageJsonFile,
      serializedPackageJson,
      "utf-8"
    );
  }
}
