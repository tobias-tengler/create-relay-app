import { TaskBase } from "../TaskBase.js";
import { ProjectSettings } from "../types.js";
import fs from "fs-extra";
import path from "path";

export class GenerateArtifactDirectoryTask extends TaskBase {
  constructor(private settings: ProjectSettings) {
    super();
  }

  async run(): Promise<void> {
    if (!this.settings.artifactDirectoryPath) {
      return;
    }

    const fullpath = path.join(
      this.settings.projectRootDirectory,
      this.settings.artifactDirectoryPath
    );

    // todo: handle error
    fs.mkdirSync(fullpath, { recursive: true });
  }
}
