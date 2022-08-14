import { CliArguments } from "./types.js";
import { prettifyPath } from "./helpers.js";

// todo: remove
function buildFinalArgs(
  defaults: CliArguments,
  answers: Partial<CliArguments>
): CliArguments {
  const combined: CliArguments = { ...defaults, ...answers };

  return {
    ...combined,
    src: prettifyPath(combined.src),
    schemaFile: prettifyPath(combined.schemaFile),
    artifactDirectory: combined.artifactDirectory
      ? prettifyPath(combined.artifactDirectory)
      : "",
  };
}
