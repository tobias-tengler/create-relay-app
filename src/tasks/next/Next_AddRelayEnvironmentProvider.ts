import traverse from "@babel/traverse";
import path from "path";
import { REACT_RELAY_PACKAGE, RELAY_ENV_PROVIDER } from "../../consts.js";
import { ProjectContext } from "../../misc/ProjectContext.js";
import { RelativePath } from "../../misc/RelativePath.js";
import { insertNamedImport, parseAst, printAst } from "../../utils/ast.js";
import { h } from "../../utils/cli.js";
import { TaskBase, TaskSkippedError } from "../TaskBase.js";
import t from "@babel/types";
import { removeExtension } from "../cra/Cra_AddRelayEnvironmentProvider.js";

const envCreation = `
const environment = useMemo(
    () => initRelayEnvironment(pageProps.initialRecords),
    [pageProps.initialRecords]
);
`;

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

    const mainFile = this.context.env.rel(path.join("pages", mainFilename));

    this.updateMessage(this.message + " in " + h(mainFile.rel));

    const code = await this.context.fs.readFromFile(mainFile.abs);

    const ast = parseAst(code);

    const envCreationAst = parseAst(envCreation).program.body[0];

    let providerWrapped = false;

    traverse.default(ast, {
      JSXElement: (path) => {
        // Find first JSX being returned *somewhere*.
        if (providerWrapped || !path.parentPath.isReturnStatement()) {
          return;
        }

        insertNamedImport(path, "useMemo", "react");

        path.parentPath.insertBefore(envCreationAst);

        const relativeImportPath = new RelativePath(
          mainFile.parentDirectory,
          removeExtension(this.context.relayEnvFile.abs)
        );

        insertNamedImport(path, "initRelayEnvironment", relativeImportPath.rel);

        const envProviderId = t.jsxIdentifier(
          insertNamedImport(path, RELAY_ENV_PROVIDER, REACT_RELAY_PACKAGE).name
        );

        // todo: check if it's anywhere in the JSX
        if (
          t.isJSXIdentifier(path.node.openingElement.name) &&
          path.node.openingElement.name.name === envProviderId.name
        ) {
          throw new TaskSkippedError(
            `JSX already wrapped with ${h(RELAY_ENV_PROVIDER)}`
          );
        }

        // Wrap JSX into RelayEnvironmentProvider.
        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(envProviderId, [
              t.jsxAttribute(
                t.jsxIdentifier("environment"),
                t.jsxExpressionContainer(t.identifier("environment"))
              ),
            ]),
            t.jsxClosingElement(envProviderId),
            [path.node]
          )
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
