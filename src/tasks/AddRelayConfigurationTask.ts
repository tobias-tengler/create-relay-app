import { TaskBase } from "../TaskBase.js";
import { promises as fs } from "fs";
import { ProjectLanguage } from "../types.js";

export class AddRelayConfigurationTask extends TaskBase {
  constructor(
    private packageJsonFile: string,
    private schemaFilePath: string,
    private language: ProjectLanguage
  ) {
    super();
  }

  async run(): Promise<void> {
    const compilerLanguage = getCompilerLanguage(this.language);

    // todo: handle error
    const packageJsonContent = await fs.readFile(this.packageJsonFile, {
      encoding: "utf-8",
    });

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
        // todo: this should probably be different for the Next.js project
        src: "./src",
        language: compilerLanguage,
        schema: this.schemaFilePath,
        exclude: [
          "**/node_modules/**",
          "**/__mocks__/**",
          "**/__generated__/**",
        ],
      };
    }

    const serializedPackageJson = JSON.stringify(packageJson, null, 2);

    // todo: handle error
    await fs.writeFile(this.packageJsonFile, serializedPackageJson, "utf-8");
  }
}

function getCompilerLanguage(
  language: ProjectLanguage
): "typescript" | "flow" | "javascript" {
  switch (language) {
    case "Typescript":
      return "typescript";
    case "Flow":
      return "flow";
    default:
      return "javascript";
  }
}
