import { TaskBase } from "../TaskBase.js";
import fs from "fs/promises";
import { ProjectSettings } from "../types.js";

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
      const relayConfig: Record<string, string | string[]> = {
        src: this.settings.srcDirectoryPath,
        language: this.settings.compilerLanguage,
        schema: this.settings.schemaFilePath,
        exclude: [
          "**/node_modules/**",
          "**/__mocks__/**",
          "**/__generated__/**",
        ],
      };

      if (this.settings.artifactDirectoryPath) {
        relayConfig.artifactDirectory = this.settings.artifactDirectoryPath;
      }

      packageJson["relay"] = relayConfig;
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
