import traverse, { NodePath } from "@babel/traverse";
import fs from "fs-extra";
import path from "path";
import { TaskBase } from "../TaskBase.js";
import t from "@babel/types";
import { parseAst, insertNamedImport, printAst } from "../ast.js";
import { isNextSettings, isViteSettings, ProjectSettings } from "../types.js";
import { REACT_RELAY_PACKAGE } from "../consts.js";

const RELAY_ENV_PROVIDER = "RelayEnvironmentProvider";
const RELAY_ENV = "RelayEnvironment";

export class AddRelayEnvironmentProviderTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    switch (this.settings.toolchain) {
      case "vite":
        await this.configureVite();
        break;
      case "next":
        await this.configureNext();
        break;
      default:
        throw new Error(`Unsupported toolchain: ${this.settings.toolchain}`);
    }
  }

  async configureNext() {
    const tSettings = this.settings.toolchainSettings;

    if (!isNextSettings(tSettings)) {
      // todo: handle correctly
      throw new Error();
    }

    const code = await fs.readFile(tSettings.appFilepath, "utf-8");

    const ast = parseAst(code);

    let providerWrapped = false;
    traverse.default(ast, {
      JSXElement: (path) => {
        // Find first JSX being returned *somewhere*.
        if (providerWrapped || !path.parentPath.isReturnStatement()) {
          return;
        }

        this.wrapJsxInProvider(path, tSettings.appFilepath);

        providerWrapped = true;

        path.skip();
      },
    });

    const updatedCode = printAst(ast, code);

    await fs.writeFile(tSettings.appFilepath, updatedCode, "utf-8");
  }

  async configureVite() {
    const tSettings = this.settings.toolchainSettings;

    if (!isViteSettings(tSettings)) {
      // todo: handle correctly
      throw new Error();
    }

    const code = await fs.readFile(tSettings.mainFilepath, "utf-8");

    const ast = parseAst(code);

    let providerWrapped = false;

    traverse.default(ast, {
      JSXElement: (path) => {
        if (providerWrapped) {
          return;
        }

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

        this.wrapJsxInProvider(path, tSettings.mainFilepath);

        providerWrapped = true;

        path.skip();
      },
    });

    const updatedCode = printAst(ast, code);

    await fs.writeFile(tSettings.mainFilepath, updatedCode, "utf-8");
  }

  private wrapJsxInProvider(
    path: NodePath<t.JSXElement>,
    sourceFilepath: string
  ) {
    const envId = insertNamedImport(
      path,
      RELAY_ENV,
      // todo: get relative path
      "./RelayEnvironment"
    );

    const envProviderId = t.jsxIdentifier(
      insertNamedImport(path, RELAY_ENV_PROVIDER, REACT_RELAY_PACKAGE).name
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
  }
}
