import { Ora } from "ora";
import { dim } from "../utils/index.js";

export abstract class TaskBase {
  private spinner?: Ora;

  abstract message: string;
  // todo: handle this properly
  enabled: boolean = true;

  abstract run(): Promise<void>;

  init(spinner: Ora) {
    this.spinner = spinner;
    this.spinner.text = this.message;
  }

  skip(message?: string): void {
    const reason = message ? ": " + message : "";

    this.spinner?.warn(this.spinner.text + " " + dim(`[Skipped${reason}]`));

    throw new TaskSkippedError();
  }

  error(): void {
    this.spinner?.fail();
  }

  complete(): void {
    this.spinner?.succeed();
  }
}

export class TaskSkippedError extends Error {}
