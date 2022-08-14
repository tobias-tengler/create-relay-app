import { Command } from "commander";
import inquirer from "inquirer";
import { CliArguments } from "../types.js";

type PromptOptions<TName extends keyof CliArguments> = {
  message: string;
  type: "list" | "confirm" | "input";
  choices?: readonly CliArguments[TName][];
};

export abstract class ArgumentBase<TName extends keyof CliArguments> {
  public abstract readonly name: TName;

  abstract registerCliOption(command: Command): void;

  abstract promptForValue(): Promise<CliArguments[TName]>;

  abstract getDefaultValue(): Promise<CliArguments[TName]>;

  protected getCliFlags(shorthand?: string, argument?: string) {
    let flags: string = "";

    if (shorthand) {
      flags += shorthand + ", ";
    }

    flags += "--" + this.name;

    if (argument) {
      flags += " " + argument;
    }

    return flags;
  }

  protected getInvalidArgError(
    value: string,
    validValues: readonly CliArguments[TName][] | CliArguments[TName]
  ): Error {
    const validValue: string =
      validValues instanceof Array
        ? validValues.join(", ")
        : typeof validValues === "string"
        ? validValues
        : validValues.toString();

    return new Error(
      `Received an invalid value for --${this.name}. Valid values are: ${validValue}. Received: ${value}`
    );
  }

  protected async showInquirerPrompt(
    options: PromptOptions<TName>
  ): Promise<CliArguments[TName]> {
    const answer = await inquirer.prompt({
      name: this.name,
      default: await this.getDefaultValue(),
      ...options,
    });

    return answer[this.name];
  }
}

export function getNormalizedCliString(input?: string): string {
  return input?.toLowerCase().trim() || "";
}
