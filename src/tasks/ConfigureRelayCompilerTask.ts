import { TaskBase } from "./TaskBase.js";
import { PACKAGE_FILE } from "../consts.js";
import { ProjectContext } from "../ProjectContext.js";
import {
  parsePackageJson,
  writePackageJson,
} from "../packageManagers/index.js";
import { h } from "../utils/cli.js";

const validateRelayArtifactsScript = "relay-compiler --validate";

export class ConfigureRelayCompilerTask extends TaskBase {
  message: string = `Configure ${h("relay-compiler")} in ${h(PACKAGE_FILE)}`;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    const packageJson = await parsePackageJson(
      this.context.env.packageJsonFile
    );

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

    relaySection["src"] = this.context.src;
    relaySection["language"] = this.context.compilerLanguage;
    relaySection["schema"] = this.context.schemaFile;
    relaySection["exclude"] = [
      "**/node_modules/**",
      "**/__mocks__/**",
      "**/__generated__/**",
    ];

    if (this.context.is("vite")) {
      // When generating without eagerEsModules artifacts contain
      // module.exports, which Vite can not handle correctly.
      // eagerEsModules will output export default.
      relaySection["eagerEsModules"] = true;
    }

    if (this.context.artifactDirectory) {
      relaySection["artifactDirectory"] = this.context.artifactDirectory;
    }

    packageJson["relay"] = relaySection;

    await writePackageJson(this.context.env.packageJsonFile, packageJson);
  }
}
