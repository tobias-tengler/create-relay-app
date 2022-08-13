import { spawn } from "child_process";
import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../types.js";

export class InstallNpmPackagesTask extends TaskBase {
  constructor(
    private packages: string[],
    private isDevDependency: boolean,
    private settings: ProjectSettings
  ) {
    super();
  }

  async run(): Promise<void> {
    const command = this.settings.packageManager;
    const useYarn = command === "yarn";
    let args: string[] = [];

    if (useYarn) {
      args = ["add", "--exact", "--cwd", this.settings.projectRootDirectory];

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
        // stdio: "inherit",
        cwd: this.settings.projectRootDirectory,
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
}
