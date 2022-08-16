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
    public args: CliArguments,
    public manager: PackageManager,
    public fs: Filesystem
  ) {
    this.src = new RelativePath(env.targetDirectory, args.src);
    this.schemaFile = new RelativePath(env.targetDirectory, args.schemaFile);

    if (args.artifactDirectory) {
      this.artifactDirectory = new RelativePath(
        env.targetDirectory,
        args.artifactDirectory
      );
    } else {
      this.artifactDirectory = null;
    }

    this.compilerLanguage = getRelayCompilerLanguage(
      args.typescript,
      args.toolchain
    );
    this.relayEnvFile = getRelayEnvFilepath(env, args);
  }

  schemaFile: RelativePath;
  src: RelativePath;
  artifactDirectory: RelativePath | null;
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

  const relativeDirectory = args.toolchain === "next" ? "./src" : args.src;

  const filepath = path.join(relativeDirectory, filename);

  return new RelativePath(env.targetDirectory, filepath);
}

// export async function getConfigFile(
//   env: EnvArguments,
//   args: CliArguments
// ): Promise<RelativePath> {
//   if (args.toolchain === "vite") {
//     const configFilename = "vite.config" + (args.typescript ? ".ts" : ".js");

//     const configFilepath = path.join(env.projectRootDirectory, configFilename);

//     if (!(await doesExist(configFilepath))) {
//       throw new Error(`${configFilename} not found`);
//     }

//     return new RelativePath(env.projectRootDirectory, configFilepath);
//   } else if (args.toolchain === "next") {
//     const configFilename = "next.config.js";

//     const configFilepath = path.join(env.projectRootDirectory, configFilename);

//     if (!(await doesExist(configFilepath))) {
//       throw new Error(`${configFilename} not found`);
//     }

//     return new RelativePath(env.projectRootDirectory, configFilepath);
//   } else {
//     return null!;
//   }
// }

// export async function getMainFile(
//   env: EnvArguments,
//   args: CliArguments
// ): Promise<RelativePath> {
//   if (args.toolchain === "vite") {
//     const mainFilename = "main" + (args.typescript ? ".tsx" : ".jsx");

//     const mainFilepath = path.join(
//       env.projectRootDirectory,
//       "src",
//       mainFilename
//     );

//     if (!(await doesExist(mainFilepath))) {
//       throw new Error(`${mainFilename} not found`);
//     }

//     return new RelativePath(env.projectRootDirectory, mainFilepath);
//   } else if (args.toolchain === "next") {
//     const mainFilename = "_app" + (args.typescript ? ".tsx" : ".js");

//     const searchDirectory = path.join(env.projectRootDirectory, "pages");

//     const mainFilepath = path.join(searchDirectory, mainFilename);

//     if (!(await doesExist(mainFilepath))) {
//       throw new Error(`${mainFilename} not found`);
//     }

//     return new RelativePath(env.projectRootDirectory, mainFilepath);
//   } else {
//     const mainFilename = "index" + (args.typescript ? ".tsx" : ".js");

//     const mainFilepath = path.join(
//       env.projectRootDirectory,
//       "src",
//       mainFilename
//     );

//     if (!(await doesExist(mainFilepath))) {
//       throw new Error(`${mainFilename} not found`);
//     }

//     return new RelativePath(env.projectRootDirectory, mainFilepath);
//   }
// }
