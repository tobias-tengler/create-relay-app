import path from "path";
import { PackageManager } from "./packageManagers/PackageManager.js";
import { RelativePath } from "./RelativePath.js";
import {
  CliArguments,
  EnvArguments,
  PackageManagerType,
  RelayCompilerLanguage,
  ToolchainType,
} from "./types.js";
import { doesExist } from "./utils/fs.js";

export class ProjectContext {
  constructor(
    public env: EnvArguments,
    public args: CliArguments,
    public manager: PackageManager
  ) {
    this.src = new RelativePath(env.projectRootDirectory, args.src);
    this.schemaFile = new RelativePath(
      env.projectRootDirectory,
      args.schemaFile
    );

    if (args.artifactDirectory) {
      this.artifactDirectory = new RelativePath(
        env.projectRootDirectory,
        args.artifactDirectory
      );
    } else {
      this.artifactDirectory = null;
    }

    this.compilerLanguage = getRelayCompilerLanguage(
      args.typescript,
      args.toolchain
    );

    this.relayEnvFile = getProjectRelayEnvFilepath(env, args);
  }

  schemaFile: RelativePath;
  src: RelativePath;
  artifactDirectory: RelativePath | null;
  compilerLanguage: RelayCompilerLanguage;

  // todo: these should come from toolchain specific settings
  relayEnvFile: RelativePath;
  configFile: RelativePath = null!;
  mainFile: RelativePath = null!;

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

function getProjectRelayEnvFilepath(
  env: EnvArguments,
  args: CliArguments
): RelativePath {
  const filename = "RelayEnvironment" + (args.typescript ? ".ts" : ".js");

  const relativeDirectory = args.toolchain === "next" ? "./src" : args.src;

  const filepath = path.join(relativeDirectory, filename);

  return new RelativePath(env.projectRootDirectory, filepath);
}

async function getConfigFile(
  env: EnvArguments,
  args: CliArguments
): Promise<RelativePath> {
  if (args.toolchain === "vite") {
    const configFilename = "vite.config" + (args.typescript ? ".ts" : ".js");

    const configFilepath = path.join(env.projectRootDirectory, configFilename);

    if (!(await doesExist(configFilepath))) {
      throw new Error(`${configFilename} not found`);
    }

    return new RelativePath(env.projectRootDirectory, configFilepath);
  } else if (args.toolchain === "next") {
    const configFilename = "next.config.js";

    const configFilepath = path.join(env.projectRootDirectory, configFilename);

    if (!(await doesExist(configFilepath))) {
      throw new Error(`${configFilename} not found`);
    }

    return new RelativePath(env.projectRootDirectory, configFilepath);
  } else {
    return null!;
  }
}

async function getMainFile(
  env: EnvArguments,
  args: CliArguments
): Promise<RelativePath> {
  if (args.toolchain === "vite") {
    const mainFilename = "main" + (args.typescript ? ".tsx" : ".jsx");

    const mainFilepath = path.join(
      env.projectRootDirectory,
      "src",
      mainFilename
    );

    if (!(await doesExist(mainFilepath))) {
      throw new Error(`${mainFilename} not found`);
    }

    return new RelativePath(env.projectRootDirectory, mainFilepath);
  } else if (args.toolchain === "next") {
    const mainFilename = "_app" + (args.typescript ? ".tsx" : ".js");

    const searchDirectory = path.join(env.projectRootDirectory, "pages");

    const mainFilepath = path.join(searchDirectory, mainFilename);

    if (!(await doesExist(mainFilepath))) {
      throw new Error(`${mainFilename} not found`);
    }

    return new RelativePath(env.projectRootDirectory, mainFilepath);
  } else {
    const mainFilename = "index" + (args.typescript ? ".tsx" : ".js");

    const mainFilepath = path.join(
      env.projectRootDirectory,
      "src",
      mainFilename
    );

    if (!(await doesExist(mainFilepath))) {
      throw new Error(`${mainFilename} not found`);
    }

    return new RelativePath(env.projectRootDirectory, mainFilepath);
  }
}
