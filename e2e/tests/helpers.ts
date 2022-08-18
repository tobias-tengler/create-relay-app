import { spawn, SpawnOptionsWithoutStdio } from "child_process";

export function runCmd(cmd: string, opt?: SpawnOptionsWithoutStdio) {
  return new Promise<void>((resolve, reject) => {
    const [executable, ...args] = cmd.split(" ");

    const child = spawn(executable, args, {
      ...opt,
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(`Command \"${executable} ${args.join(" ")}\" failed`);
        return;
      }

      resolve();
    });
  });
}
