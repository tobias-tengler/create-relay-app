import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import path from "path";
import { createDirectory, h } from "../utils/index.js";

export class GenerateArtifactDirectoryTask extends TaskBase {
  message: string = "Generate artifact directory";

  constructor(private settings: ProjectSettings) {
    super();
  }

  isEnabled(): boolean {
    return !!this.settings.artifactDirectory;
  }

  async run(): Promise<void> {
    if (!this.settings.artifactDirectory) {
      return;
    }

    this.updateMessage(
      this.message + " " + h(this.settings.artifactDirectory.rel)
    );

    // todo: handle error
    createDirectory(this.settings.artifactDirectory.abs);
  }
}
