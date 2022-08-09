#!/usr/bin/env node

import path from "path";
import { hasUnsavedGitChanges } from "./git";
import { findPackageJsonFile } from "./files";
import {
  addGraphQLSchemaFile,
  addRelayConfig,
  addRelayEnvironment,
  addRelayPluginConfiguration,
  inquireProjectSettings,
  installRelayDependencies,
} from "./tasks";

const workDir = process.cwd();

// FIND package.json file

const packageJsonFile = await findPackageJsonFile(workDir);

if (!packageJsonFile) {
  // package.json file is missing.
  throw new Error("package.json file is missing");
}

const projectDir = path.dirname(packageJsonFile);

// CHECK REPO FOR UNSAVED CHANGES

const hasUnsavedChanges = await hasUnsavedGitChanges(projectDir);

if (hasUnsavedChanges) {
  throw new Error("Project has unsaved changes");
}

const settings = await inquireProjectSettings();

installRelayDependencies(
  settings.packageManager,
  projectDir,
  settings.toolchain,
  settings.language
);

addRelayConfig(packageJsonFile, settings.language, settings.schemaFilePath);

addRelayPluginConfiguration();

addGraphQLSchemaFile(settings.schemaFilePath);

addRelayEnvironment();

// todo: show next steps with 'replace host in relayenvironment' and 'replace schema.graphql file'.

// todo: add integration tests
