import path from "path";
import {
  CliArguments,
  RelayCompilerLanguage,
  ToolchainType,
} from "../types.js";
import { Environment } from "./Environment.js";
import { Filesystem } from "./Filesystem.js";
import { PackageManager } from "./packageManagers/PackageManager.js";
import { RelativePath } from "./RelativePath.js";

export class ProjectContext {
  constructor(
    public env: Environment,
    args: CliArguments,
    public manager: PackageManager,
    public fs: Filesystem
  ) {
    this.args = args;

    this.schemaPath = this.env.rel(args.schemaFile);
    this.srcPath = this.env.rel(args.src);

    if (args.artifactDirectory) {
      this.artifactPath = this.env.rel(args.artifactDirectory);
    } else {
      this.artifactPath = null;
    }

    this.compilerLanguage = getRelayCompilerLanguage(
      args.typescript,
      args.toolchain
    );
    this.relayEnvFile = getRelayEnvFilepath(env, args);
  }

  args: Omit<CliArguments, "src" | "schemaFile" | "artifactDirectory">;

  schemaPath: RelativePath;
  srcPath: RelativePath;
  artifactPath: RelativePath | null;
  compilerLanguage: RelayCompilerLanguage;

  relayEnvFile: RelativePath;

  is(toolchain: ToolchainType): boolean {
    return this.args.toolchain === toolchain;
  }
}

function getRelayCompilerLanguage(
  useTypescript: boolean,
  toolchain: ToolchainType
): RelayCompilerLanguage {
  if (
    useTypescript ||
    // Next does not support 'javascript' as an option,
    // only typescript or flow. So we opt for typescript
    // since it's more wide spread.
    toolchain === "next"
  ) {
    return "typescript";
  } else {
    return "javascript";
  }
}

function getRelayEnvFilepath(
  env: Environment,
  args: CliArguments
): RelativePath {
  const filename = "RelayEnvironment" + (args.typescript ? ".ts" : ".js");

  const srcDirectory =
    args.toolchain === "next" ? env.rel("src").rel : args.src;

  const filepath = path.join(srcDirectory, filename);

  return env.rel(filepath);
}
