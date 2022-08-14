import { Command } from "commander";
import inquirer from "inquirer";
import { CliArguments, EnvArguments } from "../types.js";

type PromptOptions<TName extends keyof CliArguments> = {
  message: string;
  type: "list" | "confirm" | "input";
  choices?: readonly CliArguments[TName][];
};

export abstract class ArgumentBase<TName extends keyof CliArguments> {
  public abstract readonly name: TName;

  abstract registerCliOption(command: Command): void;

  abstract promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments[TName]>;

  abstract getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments[TName]>;

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

  // todo: support path completion for path inputs
  protected async showInquirerPrompt(
    options: PromptOptions<TName>,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments[TName]> {
    const defaultValue = await this.getDefaultValue(existingArgs, env);

    const answer = await inquirer.prompt({
      name: this.name,
      default: defaultValue,
      ...options,
    });

    return answer[this.name];
  }
}

export function getNormalizedCliString(input?: string): string {
  return input?.toLowerCase().trim() || "";
}
