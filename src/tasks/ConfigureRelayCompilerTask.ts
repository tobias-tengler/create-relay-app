import { TaskBase } from "./TaskBase.js";
import { PACKAGE_FILE } from "../consts.js";
import { bold } from "../utils/cli.js";
import { ProjectContext } from "../misc/ProjectContext.js";
import { RelayCompilerLanguage } from "../types.js";
import { execSync } from "child_process";

const validateRelayArtifactsScript = "relay-compiler --validate";

type RelayCompilerConfig = {
  src: string;
  language: RelayCompilerLanguage;
  schema: string;
  exclude: string[];
  eagerEsModules?: boolean;
  artifactDirectory?: string;
};

export class ConfigureRelayCompilerTask extends TaskBase {
  message: string = `Configure ${bold("relay-compiler")} in ${bold(PACKAGE_FILE)}`;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    const packageJson = await this.context.env.packageJson.parse();

    const scriptsSection: Record<string, string> = packageJson["scripts"] ?? {};

    if (!scriptsSection["relay"]) {
      const watchmanInstalled = isWatchmanInstalled();

      // Add "relay" script
      scriptsSection["relay"] = "relay-compiler";

      if (watchmanInstalled) {
        scriptsSection["relay"] += " --watch";
      }
    }

    const buildScript = scriptsSection["build"];

    if (buildScript && typeof buildScript === "string" && !buildScript.includes(validateRelayArtifactsScript)) {
      // Validate Relay's artifacts as the first build step.
      scriptsSection["build"] = validateRelayArtifactsScript + " && " + buildScript;
    }

    const relaySection = (packageJson["relay"] ?? {}) as RelayCompilerConfig;

    relaySection["src"] = this.context.srcPath.rel;
    relaySection["language"] = this.context.compilerLanguage;
    relaySection["schema"] = this.context.schemaPath.rel;

    if (!relaySection["exclude"]) {
      // We only want to add this, if the user hasn't already specified it.
      relaySection["exclude"] = ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"];
    }

    if (this.context.is("vite")) {
      // When generating without eagerEsModules artifacts contain
      // module.exports, which Vite can not handle correctly.
      // eagerEsModules will output export default.
      relaySection["eagerEsModules"] = true;
    }

    if (this.context.artifactPath) {
      relaySection["artifactDirectory"] = this.context.artifactPath.rel;
    }

    packageJson["relay"] = relaySection;

    this.context.env.packageJson.persist(packageJson);
  }
}

function isWatchmanInstalled() {
  try {
    execSync("watchman", { stdio: "ignore" });

    return true
  } catch {
    return false
  }
}