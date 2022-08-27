import { Command } from "commander";
import { CliArguments } from "../types.js";
import { ArgumentBase } from "./ArgumentBase.js";

export class WithSubscriptionsArgument extends ArgumentBase<"withSubscriptions"> {
  public name = "withSubscriptions" as const;
  public promptMessage = "Do you want to setup Subscriptions";

  constructor() {
    super();
    this.cliArg = "--with-subscriptions";
  }

  registerCliOption(command: Command): void {
    const flags = this.getCliFlags();

    command.option(flags, "setup subscriptions");
  }

  promptForValue(existingArgs: Partial<CliArguments>): Promise<boolean> {
    return this.showInquirerPrompt(
      {
        type: "confirm",
      },
      existingArgs
    );
  }

  isValid(value: boolean, existingArgs: Partial<CliArguments>): true | string {
    return true;
  }

  async getDefaultValue(existingArgs: Partial<CliArguments>): Promise<boolean> {
    return false;
  }
}
