import generate from "@babel/generator";
import { ParseResult, parse } from "@babel/parser";
import { NodePath } from "@babel/traverse";
import { format } from "prettier";
import t from "@babel/types";

export function insertNamedImport(
  path: NodePath,
  importName: string,
  packageName: string
): t.Identifier {
  const importIdentifier = t.identifier(importName);

  const program = path.findParent((p) => p.isProgram()) as NodePath<t.Program>;

  const existingImport = program.node.body.find(
    (s) =>
      t.isImportDeclaration(s) &&
      s.source.value === packageName &&
      s.specifiers.some(
        (sp) => t.isImportSpecifier(sp) && sp.local.name === importName
      )
  );

  if (!!existingImport) {
    return importIdentifier;
  }

  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.cloneNode(importIdentifier), importIdentifier)],
    t.stringLiteral(packageName)
  );

  // Insert import at start of file.
  program.node.body.unshift(importDeclaration);

  return importIdentifier;
}

export function parseAst(code: string): ParseResult<t.File> {
  return parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
}

export function printAst(ast: ParseResult<t.File>, oldCode: string): string {
  const newCode = generate.default(ast, { retainLines: true }, oldCode).code;

  return format(newCode, {
    bracketSameLine: false,
    parser: "babel-ts",
  });
}
