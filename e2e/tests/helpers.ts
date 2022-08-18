import { spawn, SpawnOptionsWithoutStdio } from "child_process";

export function runCmd(cmd: string, opt?: SpawnOptionsWithoutStdio) {
  return new Promise<void>((resolve, reject) => {
    const [executable, ...args] = cmd.split(" ");

    const child = spawn(executable, args, {
      ...opt,
      shell: true,
    });

    if (child.stdout) {
      console.log("has stdout");
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", function (data) {
        console.log("stdout: " + data);
      });
    }

    if (child.stderr) {
      console.log("has stderr");
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", function (data) {
        console.log("stderr: " + data);
      });
    }

    child.on("close", (code) => {
      console.log("closed", code);
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
