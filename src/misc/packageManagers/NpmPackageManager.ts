import { PackageManager, runCommand } from "./PackageManager.js";

export class NpmPackageManager implements PackageManager {
  id = "npm" as const;

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
    const args = [
      "install",
      "--save-exact",
      isDevDependency ? "--save-dev" : "--save",
    ];

    if (typeof packages === "string") {
      args.push(packages);
    } else {
      args.push(...packages);
    }

    return runCommand("npm", args, this.cwd);
  }
}