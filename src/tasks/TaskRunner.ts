import ora from "ora";
import { TaskBase, TaskSkippedError } from "./TaskBase.js";

type TaskDefinition = {
  title: string;
  task: TaskBase;
  when?: boolean;
};

export class TaskRunner {
  constructor(private taskDefs: TaskDefinition[]) {}

  async run(): Promise<void> {
    for (const { title, task, when } of this.taskDefs) {
      if (when === false) {
        continue;
      }

      const spinner = ora(title);

      task.init(spinner);

      try {
        spinner.start();

        await task.run();

        task.complete();
      } catch (error) {
        if (error instanceof TaskSkippedError) {
          return;
        }

        let errorMsg: string | undefined = undefined;

        if (!!error) {
          if (typeof error === "string") {
            errorMsg = error;
          } else if (error instanceof Error) {
            errorMsg = error.message;
          }
        }

        task.error();

        if (errorMsg) {
          console.log();
          console.log("  " + errorMsg);
          console.log();
        }
      }
    }
  }
}
