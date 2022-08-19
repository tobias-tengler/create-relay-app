import traverse, { NodePath } from "@babel/traverse";
import path from "path";
import {
  REACT_RELAY_PACKAGE,
  RELAY_ENV,
  RELAY_ENV_PROVIDER,
} from "../../consts.js";
import { ProjectContext } from "../../misc/ProjectContext.js";
import { RelativePath } from "../../misc/RelativePath.js";
import { insertNamedImport, parseAst, printAst } from "../../utils/ast.js";
import { h } from "../../utils/cli.js";
import { TaskBase, TaskSkippedError } from "../TaskBase.js";
import t from "@babel/types";

export class Cra_AddRelayEnvironmentProvider extends TaskBase {
  message: string = "Add " + RELAY_ENV_PROVIDER;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return this.context.is("cra");
  }

  async run(): Promise<void> {
    const mainFilename =
      "index" + (this.context.args.typescript ? ".tsx" : ".js");

    const mainFile = this.context.env.rel(path.join("src", mainFilename));

    this.updateMessage(this.message + " in " + h(mainFile.rel));

    const code = await this.context.fs.readFromFile(mainFile.abs);

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

        wrapJsxInRelayProvider(
          path,
          mainFile.parentDirectory,
          this.context.relayEnvFile.abs
        );

        providerWrapped = true;

        path.skip();
      },
    });

    if (!providerWrapped) {
      throw new Error("Could not find JSX being passed to ReactDOM.render");
    }

    const updatedCode = printAst(ast, code);

    await this.context.fs.writeToFile(mainFile.abs, updatedCode);
  }
}

export function wrapJsxInRelayProvider(
  jsxPath: NodePath<t.JSXElement>,
  fileDirectory: string,
  relayEnvPath: string
) {
  const relativeImportPath = new RelativePath(
    fileDirectory,
    removeExtension(relayEnvPath)
  );

  const envId = insertNamedImport(jsxPath, RELAY_ENV, relativeImportPath.rel);

  const envProviderId = t.jsxIdentifier(
    insertNamedImport(jsxPath, RELAY_ENV_PROVIDER, REACT_RELAY_PACKAGE).name
  );

  if (
    t.isJSXIdentifier(jsxPath.node.openingElement.name) &&
    jsxPath.node.openingElement.name.name === envProviderId.name
  ) {
    throw new TaskSkippedError(
      `JSX already wrapped with ${h(RELAY_ENV_PROVIDER)}`
    );
  }

  // Wrap JSX into RelayEnvironmentProvider.
  jsxPath.replaceWith(
    t.jsxElement(
      t.jsxOpeningElement(envProviderId, [
        t.jsxAttribute(
          t.jsxIdentifier("environment"),
          t.jsxExpressionContainer(envId)
        ),
      ]),
      t.jsxClosingElement(envProviderId),
      [jsxPath.node]
    )
  );
}

export function removeExtension(filename: string): string {
  return filename.substring(0, filename.lastIndexOf(".")) || filename;
}
