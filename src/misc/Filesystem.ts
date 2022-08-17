import path from "path";
import fs from "fs/promises";
import { existsSync, lstatSync } from "fs";
import fsExtra from "fs-extra";
import glob from "glob";

export class Filesystem {
  getParent(filepath: string): string {
    return path.dirname(filepath);
  }

  isDirectory(directoryPath: string): boolean {
    if (!this.exists(directoryPath)) {
      // If the path does not exist, we check that it doesn't
      // have a file extension to determine whether it's a
      // directory path.
      const ext = path.extname(directoryPath);

      return !ext;
    }

    return lstatSync(directoryPath).isDirectory();
  }

  isFile(filePath: string): boolean {
    if (!this.exists(filePath)) {
      // If the path does not exist, we check if it has a
      // file extension to determine whether it's a file or not.
      const ext = path.extname(filePath);

      return !!ext;
    }

    return lstatSync(filePath).isFile();
  }

  isSubDirectory(parent: string, dir: string): boolean {
    const relative = path.relative(parent, dir);

    return !relative.startsWith("..") && !path.isAbsolute(relative);
  }

  copyFile(src: string, dest: string): Promise<void> {
    return fs.copyFile(src, dest);
  }

  exists(filepath: string): boolean {
    return existsSync(filepath);
  }

  readFromFile(filepath: string): Promise<string> {
    return fs.readFile(filepath, "utf-8");
  }

  writeToFile(filepath: string, content: string): Promise<void> {
    return fs.writeFile(filepath, content, "utf-8");
  }

  appendToFile(filepath: string, content: string): Promise<void> {
    return fs.appendFile(filepath, content, "utf-8");
  }

  createDirectory(directoryPath: string): Promise<void> {
    return fsExtra.mkdir(directoryPath, { recursive: true });
  }
}
