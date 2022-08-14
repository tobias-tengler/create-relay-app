import { exec } from "child_process";
import path from "path";
import { Toolchain } from "./types.js";
import { highlight, isSubDirectory } from "./utils/index.js";

// todo: inline into specific arguments

export function isValidSchemaPath(
  input: string,
  projectRootDirectory: string
): string | true {
  if (!input) {
    return "Required";
  }

  if (!input.endsWith(".graphql")) {
    return `File needs to end in ${highlight(".graphql")}`;
  }

  if (!isSubDirectory(projectRootDirectory, input)) {
    return `Must be directory below ${highlight(projectRootDirectory)}`;
  }

  return true;
}

export function isValidSrcDirectory(
  input: string,
  projectRootDirectory: string
): string | true {
  if (!input) {
    return `Required`;
  }

  if (!isSubDirectory(projectRootDirectory, input)) {
    return `Must be directory below ${highlight(projectRootDirectory)}`;
  }

  return true;
}

export function isValidArtifactDirectory(
  input: string | null,
  toolchain: Toolchain,
  projectRootDirectory: string
): string | true {
  if (!input) {
    if (toolchain === "next") {
      return "Required";
    }

    // The artifactDirectory is optional.
    return true;
  }

  if (path.basename(input) !== "__generated__") {
    return `Last directory segment should be called ${highlight(
      "__generated__"
    )}`;
  }

  if (!isSubDirectory(projectRootDirectory, input)) {
    return `Must be directory below ${highlight(projectRootDirectory)}`;
  }

  const relativePagesDir = "./pages";
  const pagesDirectory = path.join(projectRootDirectory, relativePagesDir);

  if (toolchain === "next" && isSubDirectory(pagesDirectory, input)) {
    return `Can not be under ${highlight(relativePagesDir)}`;
  }

  return true;
}

export async function hasUnsavedGitChanges(dir: string): Promise<boolean> {
  const isPartOfGitRepo = await new Promise<boolean>((resolve) => {
    exec("git rev-parse --is-inside-work-tree", { cwd: dir }, (error) => {
      resolve(!error);
    });
  });

  if (!isPartOfGitRepo) {
    return false;
  }

  const hasUnsavedChanges = await new Promise<boolean>((resolve) => {
    exec("git status --porcelain", { cwd: dir }, (error, stdout) => {
      resolve(!!error || !!stdout);
    });
  });

  return hasUnsavedChanges;
}
