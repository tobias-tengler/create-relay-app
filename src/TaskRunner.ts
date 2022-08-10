import ora from "ora";
import { TaskBase, TaskSkippedError } from "./TaskBase.js";

type TaskDefinition = {
  title: string;
  task: TaskBase;
};

export class TaskRunner {
  constructor(private taskDefs: TaskDefinition[]) {}

  async run(): Promise<void> {
    for (const { title, task } of this.taskDefs) {
      const spinner = ora(title);

      task.setSpinner(spinner);

      try {
        spinner.start();

        await task.run();

        task.complete();
      } catch (error) {
        console.log(error);
        if (error instanceof TaskSkippedError) {
          return;
        }

        let errorMsg: string;

        if (!!error && typeof error === "string") {
          errorMsg = error;
        }

        errorMsg ??= "Unexpected error";

        task.error(errorMsg);

        // throw error;
        break;
      }
    }
  }
}
