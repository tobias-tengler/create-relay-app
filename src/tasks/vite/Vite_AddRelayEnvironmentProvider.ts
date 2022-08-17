import traverse from "@babel/traverse";
import path from "path";
import { RELAY_ENV_PROVIDER } from "../../consts.js";
import { ProjectContext } from "../../misc/ProjectContext.js";
import { RelativePath } from "../../misc/RelativePath.js";
import { parseAst, printAst } from "../../utils/ast.js";
import { h } from "../../utils/cli.js";
import { TaskBase } from "../TaskBase.js";
import t from "@babel/types";
import { Cra_AddRelayEnvironmentProvider } from "../cra/Cra_AddRelayEnvironmentProvider.js";

export class Vite_AddRelayEnvironmentProvider extends TaskBase {
  message: string = "Add " + RELAY_ENV_PROVIDER;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return this.context.is("vite");
  }

  async run(): Promise<void> {
    const mainFilename =
      "main" + (this.context.args.typescript ? ".tsx" : ".jsx");

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

        Cra_AddRelayEnvironmentProvider.wrapJsxInProvider(
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
