import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { BABEL_RELAY_PACKAGE, VITE_RELAY_PACKAGE } from "../consts.js";
import { installNpmPackages } from "../utils/packages.js";

export class InstallNpmDevDependenciesTask extends TaskBase {
  message = "Add Relay devDependencies";

  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    if (this.settings.skipInstall) {
      this.skip();
      return;
    }

    const packages = this.getPackages();

    // todo: update title

    await installNpmPackages(
      this.settings.packageManager,
      this.settings.projectRootDirectory,
      packages,
      true
    );
  }

  private getPackages() {
    const relayDevDep = ["relay-compiler"];

    if (this.settings.typescript) {
      relayDevDep.push("@types/react-relay");
      relayDevDep.push("@types/relay-runtime");
    }

    if (["cra", "vite"].some((t) => t === this.settings.toolchain)) {
      relayDevDep.push(BABEL_RELAY_PACKAGE);
    }

    if (this.settings.toolchain === "vite") {
      relayDevDep.push(VITE_RELAY_PACKAGE);
    }

    return relayDevDep;
  }
}
