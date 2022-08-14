import chalk from "chalk";

export function printError(message: string): void {
  console.log(chalk.red("✖") + " " + message);
}

export function headline(message: string): string {
  return chalk.cyan.bold.underline(message);
}

export function highlight(message: string): string {
  return chalk.cyan.bold(message);
}

export function dim(message: string): string {
  return chalk.dim(message);
}