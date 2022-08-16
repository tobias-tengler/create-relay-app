import { TaskBase } from "./TaskBase.js";
import traverse from "@babel/traverse";
import t from "@babel/types";
import {
  h,
  insertDefaultImport,
  parseAst,
  printAst,
  readFromFile,
  writeToFile,
} from "../utils/index.js";
import { ProjectContext } from "../ProjectContext.js";

export class ConfigureGraphQLTransformTask extends TaskBase {
  message: string = "Configure graphql transform";

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return this.context.is("vite") || this.context.is("next");
  }

  async run(): Promise<void> {
    this.updateMessage(this.message + " in " + h(this.context.configFile.rel));

    // todo: pull toolchain specific settings out
    switch (this.context.args.toolchain) {
      case "vite":
        await this.configureVite();
        break;
      case "next":
        await this.configureNext();
        break;
      default:
        throw new Error(
          `Unsupported toolchain: ${this.context.args.toolchain}`
        );
    }
  }

  // todo: handle some cases where we can't find things
  private async configureNext() {
    // todo: handle errors
    const configCode = await readFromFile(this.context.configFile.abs);

    const ast = parseAst(configCode);

    traverse.default(ast, {
      AssignmentExpression: (path) => {
        const node = path.node;

        // We are looking for module.exports = ???.
        if (
          node.operator !== "=" ||
          !t.isMemberExpression(node.left) ||
          !t.isIdentifier(node.left.object) ||
          !t.isIdentifier(node.left.property) ||
          node.left.object.name !== "module" ||
          node.left.property.name !== "exports"
        ) {
          return;
        }

        let objExp: t.ObjectExpression;

        // We are looking for the object expression
        // that was assigned to module.exports.
        if (t.isIdentifier(node.right)) {
          // The export is linked to a variable,
          // so we need to resolve the variable declaration.
          const binding = path.scope.getBinding(node.right.name);

          if (
            !binding ||
            !t.isVariableDeclarator(binding.path.node) ||
            !t.isObjectExpression(binding.path.node.init)
          ) {
            return;
          }

          objExp = binding.path.node.init;
        } else if (t.isObjectExpression(node.right)) {
          objExp = node.right;
        } else {
          return;
        }

        // We are creating or getting the 'compiler' property.
        let compilerProperty = objExp.properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key) &&
            p.key.name === "compiler"
        ) as t.ObjectProperty;

        if (!compilerProperty) {
          compilerProperty = t.objectProperty(
            t.identifier("compiler"),
            t.objectExpression([])
          );

          objExp.properties.push(compilerProperty);
        }

        if (!t.isObjectExpression(compilerProperty.value)) {
          return;
        }

        const relayProperty = compilerProperty.value.properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key) &&
            p.key.name === "relay"
        );

        // todo: we should merge here
        if (!!relayProperty) {
          // A "relay" property already exists.
          return;
        }

        const objProperties: t.ObjectProperty[] = [
          t.objectProperty(
            t.identifier("src"),
            t.stringLiteral(this.context.src.rel)
          ),
          t.objectProperty(
            t.identifier("language"),
            t.stringLiteral(this.context.compilerLanguage)
          ),
        ];

        if (this.context.artifactDirectory) {
          objProperties.push(
            t.objectProperty(
              t.identifier("artifactDirectory"),
              t.stringLiteral(this.context.artifactDirectory.rel)
            )
          );
        }

        // Add the "relay" property to the "compiler" property object.
        compilerProperty.value.properties.push(
          t.objectProperty(
            t.identifier("relay"),
            t.objectExpression(objProperties)
          )
        );
      },
    });

    const updatedConfigCode = printAst(ast, configCode);

    await writeToFile(this.context.configFile.abs, updatedConfigCode);
  }

  // todo: handle some cases where we can't find things
  private async configureVite() {
    // todo: handle errors
    const configCode = await readFromFile(this.context.configFile.abs);

    const ast = parseAst(configCode);

    traverse.default(ast, {
      ExportDefaultDeclaration: (path) => {
        const relayImportId = insertDefaultImport(
          path,
          "relay",
          // todo: replace with VITE_RELAY_PACKAGE,
          // once it no longer has the explict version
          "vite-plugin-relay"
        );

        const node = path.node;

        // Find export default defineConfig(???)
        if (
          !t.isCallExpression(node.declaration) ||
          node.declaration.arguments.length < 1 ||
          !t.isIdentifier(node.declaration.callee) ||
          node.declaration.callee.name !== "defineConfig"
        ) {
          return;
        }

        const arg = node.declaration.arguments[0];

        if (!t.isObjectExpression(arg)) {
          return;
        }

        // We are creating or getting the 'plugins' property.
        let pluginsProperty = arg.properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key) &&
            p.key.name === "plugins"
        ) as t.ObjectProperty;

        if (!pluginsProperty) {
          pluginsProperty = t.objectProperty(
            t.identifier("plugins"),
            t.arrayExpression([])
          );

          arg.properties.push(pluginsProperty);
        }

        if (!t.isArrayExpression(pluginsProperty.value)) {
          return;
        }

        const vitePlugins = pluginsProperty.value.elements;

        if (
          vitePlugins.some(
            (p) => t.isIdentifier(p) && p.name === relayImportId.name
          )
        ) {
          // The "vite-plugin-relay" is already added to the plugins.
          return;
        }

        // Add the "relay" import to the beginning of "plugins".
        vitePlugins.splice(0, 0, relayImportId);
      },
    });

    const updatedConfigCode = printAst(ast, configCode);

    await writeToFile(this.context.configFile.abs, updatedConfigCode);
  }
}
