import { spawn } from "child_process";

export class CommandRunner {
  run(command: string, args: string[], cwd?: string) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: cwd,
        shell: true,
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(`Command \"${command} ${args.join(" ")}\" failed`);
          return;
        }

        resolve();
      });
    });
  }
}
