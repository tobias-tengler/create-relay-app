import { TaskBase } from "./TaskBase.js";
import { h } from "../utils/index.js";
import { ProjectContext } from "../ProjectContext.js";

export class GenerateArtifactDirectoryTask extends TaskBase {
  message: string = "Generate artifact directory";

  constructor(private context: ProjectContext) {
    super();
  }

  isEnabled(): boolean {
    return !!this.context.artifactDirectory;
  }

  async run(): Promise<void> {
    if (!this.context.artifactDirectory) {
      return;
    }

    this.updateMessage(
      this.message + " " + h(this.context.artifactDirectory.rel)
    );

    // todo: handle error
    this.context.fs.createDirectory(this.context.artifactDirectory.abs);
  }
}
