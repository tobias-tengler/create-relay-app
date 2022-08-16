import { spawn } from "child_process";
import { PackageManagerType } from "../../types.js";

export interface PackageManager {
  readonly id: PackageManagerType;

  addDependency(packages: string[] | string): Promise<void>;

  addDevDependency(packages: string[] | string): Promise<void>;
}

// todo: maybe place elsewhere
export function runCommand(command: string, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      // stdio: "inherit",
      cwd: cwd,
      env: process.env,
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(" ")}` });
        return;
      }

      resolve();
    });
  });
}
