import generate from "@babel/generator";
import { ParseResult, parse } from "@babel/parser";
import { NodePath } from "@babel/traverse";
import { format } from "prettier";
import t from "@babel/types";

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

export function insertNamedImport(
  path: NodePath,
  importName: string,
  packageName: string
): t.Identifier {
  const importIdentifier = t.identifier(importName);

  const program = path.findParent((p) => p.isProgram()) as NodePath<t.Program>;

  const existingImport = getNamedImport(program, importName, packageName);

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

export function insertDefaultImport(
  path: NodePath,
  importName: string,
  packageName: string
): t.Identifier {
  const importIdentifier = t.identifier(importName);

  const program = path.findParent((p) => p.isProgram()) as NodePath<t.Program>;

  const existingImport = getDefaultImport(program, importName, packageName);

  if (!!existingImport) {
    return importIdentifier;
  }

  const importDeclaration = t.importDeclaration(
    [t.importDefaultSpecifier(t.cloneNode(importIdentifier))],

    t.stringLiteral(packageName)
  );

  // Insert import at start of file.
  program.node.body.unshift(importDeclaration);

  return importIdentifier;
}

export function getNamedImport(
  path: NodePath<t.Program>,
  importName: string,
  packageName: string
): t.ImportDeclaration {
  return path.node.body.find(
    (s) =>
      t.isImportDeclaration(s) &&
      s.source.value === packageName &&
      s.specifiers.some(
        (sp) => t.isImportSpecifier(sp) && sp.local.name === importName
      )
  ) as t.ImportDeclaration;
}

export function getDefaultImport(
  path: NodePath<t.Program>,
  importName: string,
  packageName: string
): t.ImportDeclaration {
  return path.node.body.find(
    (s) =>
      t.isImportDeclaration(s) &&
      s.source.value === packageName &&
      s.specifiers.some(
        (sp) => t.isImportDefaultSpecifier(sp) && sp.local.name === importName
      )
  ) as t.ImportDeclaration;
}

export function mergeProperties(
  existingProps: t.ObjectExpression["properties"],
  newProps: t.ObjectProperty[]
): t.ObjectExpression["properties"] {
  let existingCopy = [...existingProps];

  for (const prop of newProps) {
    const existingIndex = existingCopy.findIndex(
      (p) => t.isObjectProperty(p) && p.key === prop.key
    );

    if (existingIndex !== -1) {
      existingCopy[existingIndex] = prop;
    } else {
      existingCopy.push(prop);
    }
  }

  return existingCopy;
}
