import path from "path";
import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../../types.js";
import { doesExist, appendToFile, readFromFile, h } from "../../utils/index.js";
import { EOL } from "os";
import { BABEL_RELAY_MACRO } from "../../consts.js";
import { RelativePath } from "../../RelativePath.js";

const babelMacroTypeDef = `${EOL}
declare module "babel-plugin-relay/macro" {
  export { graphql as default } from "react-relay";
}`;

export class AddBabelMacroTypeDefinitionsTask extends TaskBase {
  message: string = `Add ${h(BABEL_RELAY_MACRO)} type definitions`;

  constructor(private settings: ProjectSettings) {
    super();
  }

  isEnabled(): boolean {
    return this.settings.toolchain === "cra" && this.settings.typescript;
  }

  async run(): Promise<void> {
    if (this.settings.toolchain !== "cra" && !this.settings.typescript) {
      this.skip("Not a Typescript Create React App project");
      return;
    }

    const reactTypeDefFilepath = new RelativePath(
      this.settings.projectRootDirectory,
      "src/react-app-env.d.ts"
    );

    this.updateMessage(this.message + " to " + h(reactTypeDefFilepath.rel));

    if (!doesExist(reactTypeDefFilepath.abs)) {
      throw new Error(`Could not find ${h(reactTypeDefFilepath.rel)}`);
    }

    const typeDefContent = await readFromFile(reactTypeDefFilepath.abs);

    if (typeDefContent.includes('declare module "babel-plugin-relay/macro"')) {
      this.skip("Type definitions already exist");
      return;
    }

    try {
      await appendToFile(reactTypeDefFilepath.abs, babelMacroTypeDef);
    } catch (error) {
      throw new Error(
        `Could not append ${BABEL_RELAY_MACRO} to ${h(
          reactTypeDefFilepath.rel
        )}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }
}
