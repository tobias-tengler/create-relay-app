import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import { CliArguments, EnvArguments } from "../types.js";

type PromptOptions<TName extends keyof CliArguments> = {
  type: "list" | "confirm" | "input";
  choices?: readonly CliArguments[TName][];
  validate?(input: string): true | string;
};

export abstract class ArgumentBase<TName extends keyof CliArguments> {
  public abstract readonly name: TName;
  public abstract readonly promptMessage: string;

  abstract registerCliOption(command: Command): void;

  abstract promptForValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments[TName]>;

  abstract getDefaultValue(
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments[TName]>;

  abstract isValid(
    value: CliArguments[TName],
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): true | string;

  submitWithValue(value: CliArguments[TName]) {
    console.log(
      `${chalk.green("?")} ${this.promptMessage} ${chalk.cyan(value)}`
    );
  }

  getInvalidArgError(
    value: any,
    validValues?: readonly CliArguments[TName][] | CliArguments[TName],
    reason?: string
  ): Error {
    let msg = `Received an invalid value for --${this.name}: \"${value}\".`;

    if (validValues) {
      const validValueString: string =
        validValues instanceof Array
          ? validValues.join(", ")
          : typeof validValues === "string"
          ? validValues
          : validValues.toString();

      msg += " Valid values are: " + validValueString + ".";
    } else if (reason) {
      msg += " " + reason;
    }

    return new InvalidArgError(msg);
  }

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

  // todo: support path completion for path inputs
  protected async showInquirerPrompt(
    options: PromptOptions<TName>,
    existingArgs: Partial<CliArguments>,
    env: EnvArguments
  ): Promise<CliArguments[TName]> {
    const defaultValue = await this.getDefaultValue(existingArgs, env);

    const answer = await inquirer.prompt({
      name: this.name,
      message: this.promptMessage,
      default: defaultValue,
      ...options,
    });

    return answer[this.name];
  }
}

export function getNormalizedCliString(input?: string): string {
  return input?.toLowerCase().trim() || "";
}

export class InvalidArgError extends Error {}
