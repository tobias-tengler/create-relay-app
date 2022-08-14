import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { installNpmPackages } from "../utils/index.js";

export class InstallNpmPackagesTask extends TaskBase {
  constructor(
    private packages: string[],
    private isDevDependency: boolean,
    private settings: ProjectSettings
  ) {
    super();
  }

  async run(): Promise<void> {
    await installNpmPackages(
      this.settings.packageManager,
      this.settings.projectRootDirectory,
      this.packages,
      this.isDevDependency
    );
  }
}
