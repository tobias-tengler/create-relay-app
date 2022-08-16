import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import { BABEL_RELAY_PACKAGE, VITE_RELAY_PACKAGE } from "../consts.js";
import { installNpmPackages } from "../utils/packages.js";
import { h } from "../utils/cli.js";

export class InstallNpmDevDependenciesTask extends TaskBase {
  message = "Add Relay devDependencies";

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

    const packages = this.getPackages();

    this.updateMessage(
      this.message + " " + packages.map((p) => h(p)).join(" ")
    );

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

    if (
      this.settings.toolchain === "vite" ||
      this.settings.toolchain === "cra"
    ) {
      relayDevDep.push(BABEL_RELAY_PACKAGE);
    }

    if (this.settings.toolchain === "vite") {
      relayDevDep.push(VITE_RELAY_PACKAGE);
    }

    return relayDevDep;
  }
}
