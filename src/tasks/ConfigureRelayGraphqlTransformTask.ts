import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import fs from "fs/promises";
import traverse from "@babel/traverse";
import t from "@babel/types";
import { insertDefaultImport, parseAst, printAst } from "../ast.js";

export class ConfigureRelayGraphqlTransformTask extends TaskBase {
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

  private async configureNext() {
    // todo: handle errors
    const configCode = await fs.readFile(this.settings.configFilepath, "utf-8");

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
          throw new Error(
            `Expected to find a module.exports assignment that exports the Next.js configuration from ${this.settings.configFilepath}.`
          );
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
              `module.exports in ${this.settings.configFilepath} references a variable, which is not a valid object definition.`
            );
          }

          objExp = binding.path.node.init;
        } else if (t.isObjectExpression(node.right)) {
          objExp = node.right;
        } else {
          throw new Error(
            `Expected to find a module.exports assignment that exports the Next.js configuration from ${this.settings.configFilepath}.`
          );
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
          throw new Error(
            `Could not create or get a "compiler" property on the Next.js configuration object in ${this.settings.configFilepath}.`
          );
        }

        const relayProperty = compilerProperty.value.properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key) &&
            p.key.name === "relay"
        );

        if (!!relayProperty) {
          // A "relay" property already exists.
          return;
        }

        const objProperties: t.ObjectProperty[] = [
          t.objectProperty(
            t.identifier("src"),
            t.stringLiteral(this.settings.src)
          ),
          t.objectProperty(
            t.identifier("language"),
            t.stringLiteral(this.settings.compilerLanguage)
          ),
        ];

        if (this.settings.artifactDirectory) {
          objProperties.push(
            t.objectProperty(
              t.identifier("artifactDirectory"),
              t.stringLiteral(this.settings.artifactDirectory)
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

    await fs.writeFile(
      this.settings.configFilepath,
      updatedConfigCode,
      "utf-8"
    );
  }

  private async configureVite() {
    // todo: handle errors
    const configCode = await fs.readFile(this.settings.configFilepath, "utf-8");

    const ast = parseAst(configCode);

    traverse.default(ast, {
      ExportDefaultDeclaration: (path) => {
        // todo: replace with VITE_RELAY_PACKAGE,
        // once it no longer has the explict version
        const relayImportId = insertDefaultImport(
          path,
          "relay",
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
          throw new Error(
            `Expected a export default defineConfig({}) in ${this.settings.configFilepath}.`
          );
        }

        const arg = node.declaration.arguments[0];

        if (!t.isObjectExpression(arg)) {
          throw new Error(
            `Expected a export default defineConfig({}) in ${this.settings.configFilepath}.`
          );
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
          throw new Error(
            `Could not create or get a "plugins" property on the Vite configuration object in ${this.settings.configFilepath}.`
          );
        }

        const vitePlugins = pluginsProperty.value.elements;

        if (
          vitePlugins.some(
            (p) => t.isIdentifier(p) && p.name === relayImportId.name
          )
        ) {
          // A "relay" entry already exists.
          return;
        }

        // Add the "relay" import to the "plugins".
        vitePlugins.push(relayImportId);
      },
    });

    const updatedConfigCode = printAst(ast, configCode);

    await fs.writeFile(
      this.settings.configFilepath,
      updatedConfigCode,
      "utf-8"
    );
  }
}
