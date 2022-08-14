import { TaskBase } from "../TaskBase.js";
import fs from "fs/promises";
import { ProjectSettings } from "../types.js";

const validateRelayArtifactsScript = "relay-compiler --validate";

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
    }

    const buildScript = scriptsSection["build"];

    if (
      buildScript &&
      typeof buildScript === "string" &&
      !buildScript.includes(validateRelayArtifactsScript)
    ) {
      // There is an existing build script.
      scriptsSection["build"] =
        validateRelayArtifactsScript + " && " + buildScript;
    }

    const relaySection = packageJson["relay"] ?? {};

    relaySection["src"] = this.settings.src;
    relaySection["language"] = this.settings.compilerLanguage;
    relaySection["schema"] = this.settings.schemaFile;
    relaySection["exclude"] = [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/__generated__/**",
    ];

    if (this.settings.artifactDirectory) {
      relaySection["artifactDirectory"] = this.settings.artifactDirectory;
    }

    packageJson["relay"] = relaySection;

    const serializedPackageJson = JSON.stringify(packageJson, null, 2);

    // todo: handle error
    await fs.writeFile(
      this.settings.packageJsonFile,
      serializedPackageJson,
      "utf-8"
    );
  }
}
