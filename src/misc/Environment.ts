import { PACKAGE_FILE } from "../consts.js";
import { Filesystem } from "./Filesystem.js";
import { PackageJsonFile } from "./PackageJsonFile.js";

export class Environment {
  constructor(
    private readonly cwd: string,
    ownPackageJsonFilepath: string,
    private readonly fs: Filesystem
  ) {
    this.ownPackageJson = new PackageJsonFile(ownPackageJsonFilepath, this.fs);
  }

  async init(): Promise<void> {
    // Find the package.json of the project we are targetting.
    const packageJsonFilepath = await this.fs.traverseUpToFindFile(
      this.cwd,
      PACKAGE_FILE
    );

    if (!packageJsonFilepath) {
      throw new MissingPackageJsonError();
    }

    this.packageJson = new PackageJsonFile(packageJsonFilepath, this.fs);
    this.targetDirectory = this.fs.getParent(packageJsonFilepath);

    // Determine own package.json file location.
  }

  ownPackageJson: PackageJsonFile;
  packageJson: PackageJsonFile = null!;
  targetDirectory: string = null!;
}

export class MissingPackageJsonError extends Error {}