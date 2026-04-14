import chalk from "chalk";

export class Logger {
  constructor(private readonly verbose = false, private readonly json = false) {}

  private emit(level: string, message: string, extra?: Record<string, unknown>): void {
    if (this.json) {
      console.log(JSON.stringify({ level, message, ...extra }));
      return;
    }
    const color = level === "error" ? chalk.red : level === "warn" ? chalk.yellow : level === "success" ? chalk.green : chalk.cyan;
    const prefix = level === "error" ? "✖" : level === "warn" ? "⚠" : level === "success" ? "✔" : "•";
    console.log(`${color(prefix)} ${message}`);
  }

  info(message: string, extra?: Record<string, unknown>): void { this.emit("info", message, extra); }
  success(message: string, extra?: Record<string, unknown>): void { this.emit("success", message, extra); }
  warn(message: string, extra?: Record<string, unknown>): void { this.emit("warn", message, extra); }
  error(message: string, extra?: Record<string, unknown>): void { this.emit("error", message, extra); }
  debug(message: string, extra?: Record<string, unknown>): void {
    if (this.verbose) this.emit("debug", message, extra);
  }
}
