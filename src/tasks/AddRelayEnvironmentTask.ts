import traverse from "@babel/traverse";
import fs from "fs-extra";
import path from "path";
import {
  VITE_MAIN_FILE_NO_EXT,
  VITE_RELAY_ENV_FILE_NO_EXT,
  VITE_SRC_DIR,
} from "../consts.js";
import { findFileInDirectory, parseAst, printAst } from "../helpers.js";
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
      JSXElement: (path, node) => {
        const parent = path.parentPath.node;

        // todo: import env provider
        // todo: import export env

        // todo: check if env provider already exists

        if (
          !t.isCallExpression(parent) ||
          !t.isMemberExpression(parent.callee) ||
          !t.isIdentifier(parent.callee.property) ||
          parent.callee.property.name !== "render"
        ) {
          return;
        }

        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier(RELAY_ENV_PROVIDER), [
              t.jsxAttribute(t.jsxIdentifier("environment")),
            ]),
            t.jsxClosingElement(t.jsxIdentifier(RELAY_ENV_PROVIDER)),
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
