import { spawn } from "child_process";
import { addNpmPackages } from "../packageManager.js";
import { TaskBase } from "../TaskBase.js";
import { PackageManager } from "../types.js";

export class InstallNpmPackagesTask extends TaskBase {
  constructor(
    private packages: string[],
    private manager: PackageManager,
    private workingDirectory: string,
    private isDevDependency: boolean = false
  ) {
    super();
  }

  async run(): Promise<void> {
    const command = this.manager;
    const useYarn = this.manager === "yarn";
    let args: string[] = [];

    if (useYarn) {
      args = ["add", "--exact", "--cwd", this.workingDirectory];

      if (this.isDevDependency) {
        args.push("--dev");
      }

      args.push(...this.packages);
    } else {
      args = [
        "install",
        "--save-exact",
        this.isDevDependency ? "--save-dev" : "--save",
      ];

      args.push(...this.packages);
    }

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: "inherit",
        // cwd: this.workingDirectory,
        env: { ...process.env },
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
}
