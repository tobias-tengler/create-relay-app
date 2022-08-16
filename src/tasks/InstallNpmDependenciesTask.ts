import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { REACT_RELAY_PACKAGE } from "../consts.js";
import { installNpmPackages } from "../utils/packages.js";

export class InstallNpmDependenciesTask extends TaskBase {
  message = "Add Relay dependencies";

  constructor(private settings: ProjectSettings) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    if (this.settings.skipInstall) {
      this.skip();
      return;
    }

    const packages = [REACT_RELAY_PACKAGE];

    //${dependencies
    //     .map((d) => highlight(d))
    //     .join(" ")}`,
    // todo: update title

    await installNpmPackages(
      this.settings.packageManager,
      this.settings.projectRootDirectory,
      packages,
      false
    );
  }
}
