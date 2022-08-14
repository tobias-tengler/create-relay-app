import path from "path";
import {
  CliArguments,
  EnvArguments,
  ProjectSettings,
  RelayCompilerLanguage,
  Toolchain,
} from "./types.js";
import { BABEL_RELAY_PACKAGE, VITE_RELAY_PACKAGE } from "./consts.js";
import { findFileInDirectory } from "./utils/fs.js";

// todo: seperate this into meaningful files

export function getRelayDevDependencies(
  toolchain: Toolchain,
  useTypescript: boolean
) {
  const relayDevDep = ["relay-compiler"];

  if (useTypescript) {
    relayDevDep.push("@types/react-relay");
    relayDevDep.push("@types/relay-runtime");
  }

  if (toolchain === "cra" || toolchain === "vite") {
    relayDevDep.push(BABEL_RELAY_PACKAGE);
  }

  if (toolchain === "vite") {
    relayDevDep.push(VITE_RELAY_PACKAGE);
  }

  return relayDevDep;
}

export function getSpecifiedProperties<T extends object>(obj: Partial<T>): T {
  const keys = Object.keys(obj) as (keyof T)[];

  const newObj = {} as T;

  for (const key of keys) {
    if (obj[key] === null) {
      continue;
    }

    newObj[key] = obj[key]!;
  }

  return newObj;
}

export function getRelayCompilerLanguage(
  useTypescript: boolean,
  toolchain: Toolchain
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

export function getProjectRelayEnvFilepath(
  env: EnvArguments,
  args: CliArguments
): string {
  const filename = "RelayEnvironment" + (args.typescript ? ".ts" : ".js");

  const relativeDirectory = args.toolchain === "next" ? "src" : args.src;

  const directory = path.join(env.projectRootDirectory, relativeDirectory);

  return path.join(directory, filename);
}

export async function getToolchainSettings(
  env: EnvArguments,
  args: CliArguments
): Promise<Pick<ProjectSettings, "mainFilepath" | "configFilepath">> {
  if (args.toolchain === "vite") {
    const configFilename = "vite.config" + (args.typescript ? ".ts" : ".js");

    const configFilepath = await findFileInDirectory(
      env.projectRootDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(`${configFilename} not found`);
    }

    const mainFilename = "main" + (args.typescript ? ".tsx" : ".jsx");

    const searchDirectory = path.join(env.projectRootDirectory, "src");

    const mainFilepath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilepath) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFilepath,
      mainFilepath,
    };
  } else if (args.toolchain === "next") {
    const configFilename = "next.config.js";

    const configFilepath = await findFileInDirectory(
      env.projectRootDirectory,
      configFilename
    );

    if (!configFilepath) {
      throw new Error(`${configFilename} not found`);
    }

    const mainFilename = "_app" + (args.typescript ? ".tsx" : ".js");

    const searchDirectory = path.join(env.projectRootDirectory, "pages");

    const mainFilepath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilepath) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFilepath,
      mainFilepath,
    };
  } else {
    const mainFilename = "index" + (args.typescript ? ".tsx" : ".jsx");

    const searchDirectory = path.join(env.projectRootDirectory, "src");

    const mainFilepath = await findFileInDirectory(
      searchDirectory,
      mainFilename
    );

    if (!mainFilepath) {
      throw new Error(`${mainFilename} not found`);
    }

    return {
      configFilepath: "",
      mainFilepath,
    };
  }
}
