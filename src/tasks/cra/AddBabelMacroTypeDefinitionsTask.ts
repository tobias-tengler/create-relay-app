import path from "path";
import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../../types.js";
import {
  doesExist,
  appendToFile,
  readFromFile,
  prettifyRelativePath,
  h,
} from "../../utils/index.js";
import { EOL } from "os";
import { BABEL_RELAY_MACRO } from "../../consts.js";

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

    const reactTypeDefFilepath = path.join(
      this.settings.projectRootDirectory,
      "src",
      "react-app-env.d.ts"
    );

    const relPath = prettifyRelativePath(
      this.settings.projectRootDirectory,
      reactTypeDefFilepath
    );

    this.updateMessage(this.message + " to " + h(relPath));

    if (!doesExist(reactTypeDefFilepath)) {
      throw new Error(`Could not find ${h(relPath)}`);
    }

    const typeDefContent = await readFromFile(reactTypeDefFilepath);

    if (typeDefContent.includes('declare module "babel-plugin-relay/macro"')) {
      this.skip("Type definitions already exist");
      return;
    }

    try {
      await appendToFile(reactTypeDefFilepath, babelMacroTypeDef);
    } catch (error) {
      throw new Error(
        `Could not append ${BABEL_RELAY_MACRO} to ${h(relPath)}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }
}
