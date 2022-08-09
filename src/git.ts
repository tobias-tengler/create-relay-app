import { exec } from "child_process";

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
