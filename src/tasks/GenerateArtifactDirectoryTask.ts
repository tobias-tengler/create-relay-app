import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import path from "path";
import { createDirectory } from "../utils/index.js";

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

    const fullpath = path.join(
      this.settings.projectRootDirectory,
      this.settings.artifactDirectory
    );

    // todo: handle error
    createDirectory(fullpath);
  }
}
