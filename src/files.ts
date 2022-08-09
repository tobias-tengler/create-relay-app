import path from "path";
import { promises as fs } from "fs";

async function findFileInDirectory(
  searchedFilename: string,
  dir: string
): Promise<string | null> {
  try {
    const filenames = await fs.readdir(dir);

    for (const filename of filenames) {
      if (filename === searchedFilename) {
        const filepath = path.join(dir, filename);

        return filepath;
      }
    }
  } catch {}

  return null;
}

export async function findPackageJsonFile(dir: string): Promise<string | null> {
  const packageJsonFile = "package.json";

  let curDir = dir;
  let prevDir: string | null = null;

  while (!!curDir) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const filepath = await findFileInDirectory(packageJsonFile, curDir);

    if (!!filepath) {
      return filepath;
    }

    prevDir = curDir;
    curDir = path.join(curDir, "..");

    if (prevDir === curDir) {
      // We reached the root.
      break;
    }
  }

  return null;
}
