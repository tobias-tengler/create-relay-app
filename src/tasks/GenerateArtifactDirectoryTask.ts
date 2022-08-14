import { TaskBase } from "./TaskBase.js";
import { ProjectSettings } from "../types.js";
import path from "path";
import { createDirectory } from "../utils/fs.js";

export class GenerateArtifactDirectoryTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
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
