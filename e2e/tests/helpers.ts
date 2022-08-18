import { ChildProcess, spawn, SpawnOptions } from "child_process";

export function runCmd(cmd: string, opt?: SpawnOptions) {
  return new Promise<void>((resolve, reject) => {
    const [executable, ...args] = cmd.split(" ");

    const child = spawn(executable, args, {
      stdio: "ignore",
      ...opt,
      shell: true,
    });

    if (child.stdout) {
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", function (data) {
        console.log(data);
      });
    }

    if (child.stderr) {
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", function (data) {
        console.log(data);
      });
    }

    child.on("close", (code) => {
      if (code !== 0) {
        reject(`Command \"${executable} ${args.join(" ")}\" failed`);
        return;
      }

      resolve();
    });
  });
}

export function fireCmd(cmd: string, opt?: SpawnOptions): ChildProcess {
  const [executable, ...args] = cmd.split(" ");

  const child = spawn(executable, args, {
    stdio: "ignore",
    ...opt,
    shell: true,
  });

  if (child.stdout) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", function (data) {
      console.log(data);
    });
  }

  if (child.stderr) {
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", function (data) {
      console.log(data);
    });
  }

  return child;
}
