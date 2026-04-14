export interface ShellCommands {
  bash: string;
  zsh: string;
  powershell: string;
  cmd: string;
}

function quoteForUnix(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function quoteForPowerShell(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function quoteForCmd(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function envSetCommands(key: string, value: string): ShellCommands {
  return {
    bash: `export ${key}=${quoteForUnix(value)}`,
    zsh: `export ${key}=${quoteForUnix(value)}`,
    powershell: `$env:${key}=${quoteForPowerShell(value)}`,
    cmd: `set ${key}=${quoteForCmd(value)}`,
  };
}

export function envHelpText(key: string, value: string): string {
  const commands = envSetCommands(key, value);
  return [
    "Set environment variable in your shell:",
    `- bash: ${commands.bash}`,
    `- zsh: ${commands.zsh}`,
    `- PowerShell: ${commands.powershell}`,
    `- CMD: ${commands.cmd}`,
  ].join("\n");
}
