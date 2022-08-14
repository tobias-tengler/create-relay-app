import path from "path";
import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import {
  doesExist,
  appendToFile,
  readFromFile,
  prettifyRelativePath,
  highlight,
} from "../utils/index.js";
import { EOL } from "os";

const babelMacroTypeDef = `${EOL}
declare module "babel-plugin-relay/macro" {
  export { graphql as default } from "react-relay";
}`;

export class AddBabelMacroTypeDefinitionsTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
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

    if (!doesExist(reactTypeDefFilepath)) {
      const relPath = prettifyRelativePath(
        this.settings.projectRootDirectory,
        reactTypeDefFilepath
      );
      // todo: change
      throw new Error(`Could not find ${highlight(relPath)}`);
    }

    const typeDefContent = await readFromFile(reactTypeDefFilepath);

    if (typeDefContent.includes('declare module "babel-plugin-relay/macro"')) {
      this.skip("Type definitions already exist");
      return;
    }

    // todo: handle error
    await appendToFile(reactTypeDefFilepath, babelMacroTypeDef);
  }
}
