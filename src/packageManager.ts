import { execSync, spawn } from "child_process";
import { PackageManager } from "./types.js";
import chalk from "chalk";
import ora from "ora";

export function getPackageManagerToUse(): PackageManager {
  try {
    const userAgent = process.env.npm_config_user_agent;

    if (userAgent) {
      if (userAgent.startsWith("yarn")) {
        return "yarn";
      } else if (userAgent.startsWith("pnpm")) {
        return "pnpm";
      }
    }

    try {
      execSync("yarn --version", { stdio: "ignore" });
      return "yarn";
    } catch {
      execSync("pnpm --version", { stdio: "ignore" });
      return "pnpm";
    }
  } catch {
    return "npm";
  }
}

export function addNpmPackages(
  manager: PackageManager,
  workDir: string,
  packages: string[],
  devDep: boolean
): Promise<void> {
  const command = manager;
  const useYarn = manager === "yarn";
  let args: string[] = [];

  if (useYarn) {
    args = ["add", "--exact", "--cwd", workDir];

    if (devDep) {
      args.push("--dev");
    }

    args.push(...packages);
  } else {
    args = ["install", "--save-exact", devDep ? "--save-dev" : "--save"];

    args.push(...packages);
  }

  return new Promise((resolve, reject) => {
    // const child = spawn(command, args, {
    //   stdio: "inherit",
    //   // cwd: workDir,
    //   env: { ...process.env },
    // });

    // child.on("close", (code) => {
    //   if (code !== 0) {
    //     console.log("uwuwuwuwuuuwuwuuwuw");
    //     reject({ command: `${command} ${args.join(" ")}` });
    //     return;
    //   }

    //   resolve();
    // });
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}
