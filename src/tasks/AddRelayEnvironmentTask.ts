import traverse from "@babel/traverse";
import fs from "fs-extra";
import path from "path";
import {
  VITE_MAIN_FILE_NO_EXT,
  VITE_RELAY_ENV_FILE_NO_EXT,
} from "../consts.js";
import {
  findFileInDirectory,
  insertNamedImport,
  parseAst,
  printAst,
} from "../helpers.js";
import { TaskBase } from "../TaskBase.js";
import { ToolChain, CodeLanguage } from "../types.js";
import t from "@babel/types";

export class AddRelayEnvironmentTask extends TaskBase {
  constructor(
    private workingDirectory: string,
    private packageDirectory: string,
    private toolChain: ToolChain,
    private language: CodeLanguage
  ) {
    super();
  }

  async run(): Promise<void> {
    switch (this.toolChain) {
      case "Vite":
        await this.configureVite();
        break;
      // todo: implement CRA and Next.js
      default:
        throw new Error("Unsupported toolchain");
    }
  }

  async configureVite() {
    await this.addRelayEnvironmentFile(VITE_RELAY_ENV_FILE_NO_EXT);

    const relativeMainFilepath =
      VITE_MAIN_FILE_NO_EXT +
      (this.language === "Typescript" ? ".tsx" : ".jsx");

    const searchDirectory = path.dirname(
      path.join(this.workingDirectory, relativeMainFilepath)
    );

    const mainFilename = path.basename(relativeMainFilepath);

    const mainFilePath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilePath) {
      throw new Error(`${relativeMainFilepath} not found`);
    }

    const mainCode = await fs.readFile(mainFilePath, "utf-8");

    const ast = parseAst(mainCode);

    const RELAY_ENV_PROVIDER = "RelayEnvironmentProvider";

    traverse.default(ast, {
      JSXElement: (path) => {
        const parent = path.parentPath.node;

        // Find ReactDOM.render(...)
        if (
          !t.isCallExpression(parent) ||
          !t.isMemberExpression(parent.callee) ||
          !t.isIdentifier(parent.callee.property) ||
          parent.callee.property.name !== "render"
        ) {
          return;
        }

        const envId = insertNamedImport(
          path,
          "RelayEnvironment",
          "./RelayEnvironment"
        );
        const envProviderId = t.jsxIdentifier(
          insertNamedImport(path, RELAY_ENV_PROVIDER, "react-relay").name
        );

        if (
          t.isJSXIdentifier(path.node.openingElement.name) &&
          path.node.openingElement.name.name === envProviderId.name
        ) {
          // JSX has already been wrapped.
          return;
        }

        const test = t.jsxExpressionContainer(envId);

        // Wrap JSX inside render() into RelayEnvironmentProvider.
        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(envProviderId, [
              t.jsxAttribute(t.jsxIdentifier("environment"), test),
            ]),
            t.jsxClosingElement(envProviderId),
            [path.node]
          )
        );

        path.skip();
      },
    });

    const updatedCode = printAst(ast, mainCode);

    await fs.writeFile(mainFilePath, updatedCode, "utf-8");
  }

  async addRelayEnvironmentFile(filepathNoExt: string) {
    const isTypescript = this.language === "Typescript";

    const relativeRelayEnvFilepath =
      filepathNoExt + (isTypescript ? ".ts" : ".js");

    const relayEnvFilepath = path.join(
      this.workingDirectory,
      relativeRelayEnvFilepath
    );

    let srcFile: string;

    if (isTypescript) {
      srcFile = "./assets/env_ts";
    } else {
      srcFile = "./assets/env";
    }

    const srcFilepath = path.join(this.packageDirectory, srcFile);

    // todo: handle error
    await fs.copyFile(srcFilepath, relayEnvFilepath);
  }
}
