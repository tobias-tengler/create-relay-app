import { Ora } from "ora";
import { dim } from "../utils/cli.js";

export abstract class TaskBase {
  private spinner?: Ora;

  abstract run(): Promise<void>;

  init(spinner: Ora) {
    this.spinner = spinner;
  }

  skip(message?: string): void {
    const reason = message ? ": " + message : undefined;

    this.spinner?.warn(this.spinner.text + " " + dim(`[Skipped${reason}]`));

    throw new TaskSkippedError();
  }

  error(message: string): void {
    this.spinner?.fail(this.spinner.text + "   " + dim(message));
  }

  complete(): void {
    this.spinner?.succeed();
  }
}

export class TaskSkippedError extends Error {}
