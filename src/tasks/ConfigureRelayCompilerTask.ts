import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { h, parsePackageJson, writePackageJson } from "../utils/index.js";
import { PACKAGE_FILE } from "../consts.js";

const validateRelayArtifactsScript = "relay-compiler --validate";

export class ConfigureRelayCompilerTask extends TaskBase {
  message: string = `Configure ${h("relay-compiler")} in ${h(PACKAGE_FILE)}`;

  constructor(private settings: ProjectSettings) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    const packageJson = await parsePackageJson(this.settings.packageJsonFile);

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

    if (this.settings.toolchain === "vite") {
      // When generating without eagerEsModules artifacts contain
      // module.exports, which Vite can not handle correctly.
      // eagerEsModules will output export default.
      relaySection["eagerEsModules"] = true;
    }

    if (this.settings.artifactDirectory) {
      relaySection["artifactDirectory"] = this.settings.artifactDirectory;
    }

    packageJson["relay"] = relaySection;

    await writePackageJson(this.settings.packageJsonFile, packageJson);
  }
}
