import { TaskBase } from "./TaskBase.js";
import { REACT_RELAY_PACKAGE } from "../consts.js";
import { h } from "../utils/cli.js";
import { ProjectContext } from "../misc/ProjectContext.js";

export class InstallNpmDependenciesTask extends TaskBase {
  message = "Add Relay dependencies";

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return true;
  }

  async run(): Promise<void> {
    if (this.context.args.skipInstall) {
      this.skip();
      return;
    }

    const packages = [REACT_RELAY_PACKAGE];

    this.updateMessage(
      this.message + " " + packages.map((p) => h(p)).join(" ")
    );

    const latestPackages = packages.map((p) =>
      p.substring(1).includes("@") ? p : p + "@latest"
    );

    await this.context.manager.addDependency(latestPackages);
  }
}
