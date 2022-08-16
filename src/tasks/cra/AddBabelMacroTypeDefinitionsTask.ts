import { TaskBase } from "../TaskBase.js";
import { h } from "../../utils/index.js";
import { EOL } from "os";
import { BABEL_RELAY_MACRO } from "../../consts.js";
import { ProjectContext } from "../../misc/ProjectContext.js";
import { RelativePath } from "../../misc/RelativePath.js";

const babelMacroTypeDef = `${EOL}
declare module "babel-plugin-relay/macro" {
  export { graphql as default } from "react-relay";
}`;

export class AddBabelMacroTypeDefinitionsTask extends TaskBase {
  message: string = `Add ${h(BABEL_RELAY_MACRO)} type definitions`;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return this.context.is("cra") && this.context.args.typescript;
  }

  async run(): Promise<void> {
    if (!this.context.is("cra") && !this.context.args.typescript) {
      this.skip("Not a Typescript Create React App project");
      return;
    }

    const reactTypeDefFilepath = new RelativePath(
      this.context.env.targetDirectory,
      "src/react-app-env.d.ts"
    );

    this.updateMessage(this.message + " to " + h(reactTypeDefFilepath.rel));

    if (!this.context.fs.doesExist(reactTypeDefFilepath.abs)) {
      throw new Error(`Could not find ${h(reactTypeDefFilepath.rel)}`);
    }

    const typeDefContent = await this.context.fs.readFromFile(
      reactTypeDefFilepath.abs
    );

    if (typeDefContent.includes('declare module "babel-plugin-relay/macro"')) {
      this.skip("Type definitions already exist");
      return;
    }

    try {
      await this.context.fs.appendToFile(
        reactTypeDefFilepath.abs,
        babelMacroTypeDef
      );
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
