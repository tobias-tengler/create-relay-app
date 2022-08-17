import { PACKAGE_FILE } from "../consts.js";
import { Filesystem } from "./Filesystem.js";
import { PackageJsonFile } from "./PackageJsonFile.js";
import { RelativePath } from "./RelativePath.js";

export class Environment {
  constructor(
    public readonly cwd: string,
    ownPackageJsonFilepath: string,
    private readonly fs: Filesystem
  ) {
    this.ownPackageDirectory = fs.getParent(ownPackageJsonFilepath);
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
  }

  rel(relPath: string | undefined): RelativePath {
    return new RelativePath(this.targetDirectory, relPath);
  }

  relToTarget(cwdRelPath: string | undefined): RelativePath | undefined {
    if (!cwdRelPath) {
      return undefined;
    }

    const cwdAbs = new RelativePath(this.cwd, cwdRelPath).abs;

    return new RelativePath(this.targetDirectory, cwdAbs);
  }

  ownPackageDirectory: string;
  ownPackageJson: PackageJsonFile;
  packageJson: PackageJsonFile = null!;
  targetDirectory: string = null!;
}

export class MissingPackageJsonError extends Error {}
