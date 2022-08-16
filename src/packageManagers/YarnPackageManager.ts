import { PackageManager, runCommand } from "./PackageManager.js";

export class YarnPackageManager implements PackageManager {
  id = "yarn" as const;

  constructor(private readonly cwd: string) {}

  addDependency(packages: string | string[]): Promise<void> {
    return this.installDependency(packages, false);
  }

  addDevDependency(packages: string | string[]): Promise<void> {
    return this.installDependency(packages, true);
  }

  private installDependency(
    packages: string | string[],
    isDevDependency: boolean
  ) {
    const args = ["add", "--exact", "--cwd", this.cwd];

    if (isDevDependency) {
      args.push("--dev");
    }

    if (typeof packages === "string") {
      args.push(packages);
    } else {
      args.push(...packages);
    }

    return runCommand("yarn", args, this.cwd);
  }
}
