import { findFileInDirectory, getRelayCompilerLanguage } from "../helpers.js";
import { TaskBase } from "../TaskBase.js";
import { CodeLanguage, ToolChain } from "../types.js";
// import { parse, print, types, visit } from "recast";
import { promises as fs } from "fs";
import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import generate from "@babel/generator";
import t from "@babel/types";
import { format } from "prettier";
import { NEXTJS_CONFIG_FILE } from "../consts.js";

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
      case "Next.js":
        await this.configureNext();
        break;
      default:
        throw new Error("Unsupported toolchain");
    }
  }

  private async configureNext() {
    const configFilepath = await findFileInDirectory(
      this.workingDirectory,
      NEXTJS_CONFIG_FILE
    );

    if (!configFilepath) {
      throw new Error(
        `Could not find ${NEXTJS_CONFIG_FILE} in ${this.workingDirectory}`
      );
    }

    // todo: handle errors
    const configCode = await fs.readFile(configFilepath, "utf-8");

    const ast = parse(configCode);

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

        // We are creating or getting the 'compiler' property
        // of this object expression.
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

        if (!!relayProperty) {
          // A "relay" property already exists.
          return;
        }

        // Add the "relay" property to the "compiler" property object.
        compilerProperty.value.properties.push(
          t.objectProperty(
            t.identifier("relay"),
            t.objectExpression([
              t.objectProperty(
                t.identifier("src"),
                t.stringLiteral("./src") // todo: get through config
              ),
              t.objectProperty(
                t.identifier("language"),
                t.stringLiteral(getRelayCompilerLanguage(this.language))
              ),
              // todo: add artifact directory
            ])
          )
        );
      },
    });

    const updatedConfigCode = generate.default(
      ast,
      { retainLines: true },
      configCode
    ).code;

    const formattedConfigCode = format(updatedConfigCode, {
      bracketSameLine: false,
    });

    console.log({ configCode, formattedConfigCode });

    await fs.writeFile(configFilepath, formattedConfigCode, "utf-8");
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
