import traverse from "@babel/traverse";
import path from "path";
import { env } from "process";
import { RELAY_ENV_PROVIDER } from "../../consts.js";
import { ProjectContext } from "../../misc/ProjectContext.js";
import { RelativePath } from "../../misc/RelativePath.js";
import { parseAst, printAst } from "../../utils/ast.js";
import { h } from "../../utils/cli.js";
import { Cra_AddRelayEnvironmentProvider } from "../cra/Cra_AddRelayEnvironmentProvider.js";
import { TaskBase } from "../TaskBase.js";

export class Next_AddRelayEnvironmentProvider extends TaskBase {
  message: string = "Add " + RELAY_ENV_PROVIDER;

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return this.context.is("next");
  }

  async run(): Promise<void> {
    const mainFilename =
      "_app" + (this.context.args.typescript ? ".tsx" : ".js");

    const mainFile = new RelativePath(
      this.context.env.targetDirectory,
      path.join("pages", mainFilename)
    );

    this.updateMessage(this.message + " in " + h(mainFile.rel));

    const code = await this.context.fs.readFromFile(mainFile.abs);

    const ast = parseAst(code);

    let providerWrapped = false;

    traverse.default(ast, {
      JSXElement: (path) => {
        // Find first JSX being returned *somewhere*.
        if (providerWrapped || !path.parentPath.isReturnStatement()) {
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
      throw new Error("Could not find JSX");
    }

    const updatedCode = printAst(ast, code);

    await this.context.fs.writeToFile(mainFile.abs, updatedCode);
  }
}
