import { TaskBase } from "./TaskBase.js";
import traverse from "@babel/traverse";
import t from "@babel/types";
import {
  h,
  insertDefaultImport,
  mergeProperties,
  parseAst,
  printAst,
} from "../utils/index.js";
import { ProjectContext } from "../misc/ProjectContext.js";

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

  private async configureNext() {
    // todo: handle errors
    const configCode = await this.context.fs.readFromFile(
      this.context.configFile.abs
    );

    const ast = parseAst(configCode);

    let configured = false;

    traverse.default(ast, {
      AssignmentExpression: (path) => {
        if (configured) {
          return;
        }

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
            throw new Error(
              "`module.exports` references a variable, but the variable is not an object."
            );
          }

          objExp = binding.path.node.init;
        } else if (t.isObjectExpression(node.right)) {
          objExp = node.right;
        } else {
          throw new Error(
            "Expected to find an object initializer or variable assigned to `module.exports`."
          );
        }

        // We are creating or getting the 'compiler' property.
        let compiler_Prop = objExp.properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key) &&
            p.key.name === "compiler"
        ) as t.ObjectProperty;

        if (!compiler_Prop) {
          compiler_Prop = t.objectProperty(
            t.identifier("compiler"),
            t.objectExpression([])
          );

          objExp.properties.push(compiler_Prop);
        }

        if (!t.isObjectExpression(compiler_Prop.value)) {
          throw new Error("Expected the `compiler` property to be an object.");
        }

        let relay_ObjProps: t.ObjectExpression["properties"] = [
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
          relay_ObjProps.push(
            t.objectProperty(
              t.identifier("artifactDirectory"),
              t.stringLiteral(this.context.artifactDirectory.rel)
            )
          );
        }

        const compiler_relayProp = compiler_Prop.value.properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key) &&
            p.key.name === "relay"
        ) as t.ObjectProperty;

        if (
          compiler_relayProp &&
          t.isObjectExpression(compiler_relayProp.value)
        ) {
          // There is an existing relay: {...} definition.
          // We merge its props with the new props.
          relay_ObjProps = mergeProperties(
            compiler_relayProp.value.properties,
            relay_ObjProps
          );

          compiler_relayProp.value.properties = relay_ObjProps;
        } else {
          // We do not yet have a "relay" propery, so we add it.
          compiler_Prop.value.properties.push(
            t.objectProperty(
              t.identifier("relay"),
              t.objectExpression(relay_ObjProps)
            )
          );
        }

        path.skip();
      },
    });

    const updatedConfigCode = printAst(ast, configCode);

    await this.context.fs.writeToFile(
      this.context.configFile.abs,
      updatedConfigCode
    );
  }

  // todo: handle some cases where we can't find things
  private async configureVite() {
    // todo: handle errors
    const configCode = await this.context.fs.readFromFile(
      this.context.configFile.abs
    );

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

    await this.context.fs.writeToFile(
      this.context.configFile.abs,
      updatedConfigCode
    );
  }
}
