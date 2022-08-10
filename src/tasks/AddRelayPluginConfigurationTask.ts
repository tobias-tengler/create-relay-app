import { findFileInDirectory, getRelayCompilerLanguage } from "../helpers.js";
import { TaskBase } from "../TaskBase.js";
import { CodeLanguage, ToolChain } from "../types.js";
import { parse, print, types, visit } from "recast";
import { promises as fs } from "fs";
import { parenthesizedExpression } from "@babel/types";
import { Scope } from "ast-types/lib/scope.js";

export class AddRelayPluginConfigurationTask extends TaskBase {
  constructor(
    private workingDirectory: string,
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
      case "Next.js":
        await this.configureNext();
        break;
      default:
        throw new Error("Unsupported toolchain");
    }
  }

  private async configureNext() {
    const configFilename = "next.config.js";

    const configFilepath = await findFileInDirectory(
      this.workingDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(
        `Could not find ${configFilename} in ${this.workingDirectory}`
      );
    }

    // todo: handle errors
    const configCode = await fs.readFile(configFilename, "utf-8");

    const ast = parse(configCode);

    visit(ast, {
      visitAssignmentExpression: (path) => {
        const node = path.node;
        const n = types.namedTypes;
        const b = types.builders;

        // We are looking for module.exports = ???.
        if (
          node.operator !== "=" ||
          !n.MemberExpression.check(node.left) ||
          !n.Identifier.check(node.left.object) ||
          !n.Identifier.check(node.left.property) ||
          node.left.object.name !== "module" ||
          node.left.property.name !== "exports"
        ) {
          return false;
        }

        let objExp: types.namedTypes.ObjectExpression;

        // We are looking for the object expression
        // that was assigned to module.exports.
        if (n.Identifier.check(node.right)) {
          // The export is linked to a variable,
          // so we need to resolve the variable declaration.
          // todo: no typescript

          const scope = path.scope as Scope;
          const bindings = scope.getBindings();
          const binding = bindings[node.right.name];

          console.log("binding", binding);

          if (
            !binding ||
            !n.VariableDeclarator.check(binding.path.node) ||
            !n.ObjectExpression.check(binding.path.node.init)
          ) {
            return false;
          }

          objExp = binding.path.node.init;
        } else if (n.ObjectExpression.check(node.right)) {
          objExp = node.right;
        } else {
          return false;
        }

        // We are creating or getting the 'compiler' property
        // of this object expression.
        let compilerProperty = objExp.properties.find(
          (p) =>
            n.ObjectProperty.check(p) &&
            n.Identifier.check(p.key) &&
            p.key.name === "compiler"
        ) as types.namedTypes.ObjectProperty;

        if (!compilerProperty) {
          compilerProperty = b.objectProperty(
            b.identifier("compiler"),
            b.objectExpression([])
          );

          objExp.properties.push(compilerProperty);
        }

        if (!n.ObjectExpression.check(compilerProperty.value)) {
          return false;
        }

        // Add the "relay" property to the "compiler" property object.
        compilerProperty.value.properties.push(
          b.objectProperty(
            b.identifier("relay"),
            b.objectExpression([
              b.objectProperty(
                b.identifier("src"),
                b.stringLiteral("./src") // todo: get through config
              ),
              b.objectProperty(
                b.identifier("language"),
                b.stringLiteral(getRelayCompilerLanguage(this.language))
              ),
              // todo: add artifact directory
            ])
          )
        );

        return false;
      },
    });

    const updatedConfigCode = print(ast).code;

    console.log({ og: configCode, new: updatedConfigCode });

    await fs.writeFile(configFilepath, updatedConfigCode, "utf-8");
  }

  private async configureVite() {
    const configFilename =
      "vite.config" + (this.language === "Typescript" ? ".ts" : ".js");

    const configFilepath = await findFileInDirectory(
      this.workingDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(
        `Could not find ${configFilename} in ${this.workingDirectory}`
      );
    }

    // todo: write native plugin for vite
    // todo: parse config and modify
  }
}
