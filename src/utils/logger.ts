import chalk from "chalk";

export class Logger {
  verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(msg: string) {
    console.log(chalk.blue("ℹ") + " " + msg);
  }

  success(msg: string) {
    console.log(chalk.green("✔") + " " + msg);
  }

  warn(msg: string) {
    console.log(chalk.yellow("⚠") + " " + msg);
  }

  error(msg: string) {
    console.log(chalk.red("✖") + " " + msg);
  }

  debug(msg: string) {
    if (this.verbose) {
      console.log(chalk.gray("…") + " " + chalk.gray(msg));
    }
  }

  step(msg: string) {
    console.log(chalk.cyan("▸") + " " + msg);
  }

  blank() {
    console.log();
  }

  table(data: Record<string, string>) {
    const maxKey = Math.max(...Object.keys(data).map((k) => k.length));
    for (const [k, v] of Object.entries(data)) {
      console.log(chalk.gray("  " + k.padEnd(maxKey + 2)) + v);
    }
  }
}

let logger: Logger;

export function getLogger(verbose?: boolean): Logger {
  if (!logger || verbose !== undefined) {
    logger = new Logger(verbose);
  }
  return logger;
}
