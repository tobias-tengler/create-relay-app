import { exec } from "child_process";

export class Git {
  async hasUnsavedChanges(directory: string): Promise<boolean> {
    const isPartOfGitRepo = await new Promise<boolean>((resolve) => {
      exec(
        "git rev-parse --is-inside-work-tree",
        { cwd: directory },
        (error) => {
          resolve(!error);
        }
      );
    });

    if (!isPartOfGitRepo) {
      return false;
    }

    const hasUnsavedChanges = await new Promise<boolean>((resolve) => {
      exec("git status --porcelain", { cwd: directory }, (error, stdout) => {
        resolve(!!error || !!stdout);
      });
    });

    return hasUnsavedChanges;
  }
}
