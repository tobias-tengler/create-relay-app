import { TaskBase } from "./TaskBase.js";
import { bold } from "../utils/cli.js";
import { ProjectContext } from "../misc/ProjectContext.js";
import { RelayCompilerLanguage } from "../types.js";

type RelayCompilerConfig = {
  src: string;
  language: RelayCompilerLanguage;
  schema: string;
  excludes: string[];
  eagerEsModules?: boolean;
  artifactDirectory?: string;
};

export class ConfigureRelayCompilerTask extends TaskBase {
  message: string = `Configure ${bold("relay-compiler")}`;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    this.updateMessage(this.message + ` in ${bold(this.context.relayConfigFile.rel)}`)

    let relayConfig: Partial<RelayCompilerConfig>;

    try {
      const relayConfigContent = await this.context.fs.readFromFile(this.context.relayConfigFile.abs);

      relayConfig = JSON.parse(relayConfigContent) || {}
    }
    catch {
      relayConfig = {};
    }

    relayConfig["src"] = this.context.srcPath.rel;
    relayConfig["language"] = this.context.compilerLanguage;
    relayConfig["schema"] = this.context.schemaPath.rel;

    if (!relayConfig["excludes"]) {
      // We only want to add this, if the user hasn't already specified it.
      relayConfig["excludes"] = ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"];
    }

    if (this.context.is("vite")) {
      // When generating without eagerEsModules artifacts contain
      // module.exports, which Vite can not handle correctly.
      // eagerEsModules will output export default.
      relayConfig["eagerEsModules"] = true;
    }

    if (this.context.artifactPath) {
      relayConfig["artifactDirectory"] = this.context.artifactPath.rel;
    }

    const relayConfigWriteContent = JSON.stringify(relayConfig, null, 2);

    await this.context.fs.writeToFile(this.context.relayConfigFile.abs, relayConfigWriteContent)
  }
}
