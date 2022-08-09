import ora from "ora";
import { TaskBase } from "./TaskBase.js";

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
        await task.run();
      } catch (error) {
        task.error("Unexpected error");

        throw error;
      }
    }
  }
}
