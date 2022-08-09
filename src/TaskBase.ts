import chalk from "chalk";
import { Ora } from "ora";

export abstract class TaskBase {
  private spinner?: Ora;

  abstract run(): Promise<void>;

  setSpinner(spinner: Ora) {
    this.spinner = spinner;
  }

  skip(message: string): void {
    this.spinner?.warn(
      this.spinner.text + " " + chalk.dim("[Skipped: " + message + "]")
    );

    throw new TaskSkippedError();
  }

  error(message: string): void {
    this.spinner?.fail(this.spinner.text + "   " + chalk.dim(message));
  }

  complete(): void {
    this.spinner?.succeed();
  }
}

export class TaskSkippedError extends Error {}
