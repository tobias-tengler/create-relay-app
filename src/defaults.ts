import path from "path";
import { CliArguments, EnvArguments } from "./types.js";

// todo: move elsewhere
export function getProjectRelayEnvFilepath(
  env: EnvArguments,
  args: CliArguments
): string {
  const filename = "RelayEnvironment" + (args.typescript ? ".ts" : ".js");

  const relativeDirectory = args.toolchain === "next" ? "src" : args.src;

  const directory = path.join(env.projectRootDirectory, relativeDirectory);

  return path.join(directory, filename);
}
