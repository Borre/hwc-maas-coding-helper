import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname } from "node:path";

export function pathExists(path: string): boolean {
  return existsSync(path);
}

export function ensureDirForFile(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function readTextIfExists(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return readFileSync(path, "utf8");
}

export function backupFile(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${path}.bak.${stamp}`;
  copyFileSync(path, backupPath);
  return backupPath;
}

export function writeTextFile(path: string, content: string): void {
  ensureDirForFile(path);
  writeFileSync(path, content, "utf8");
}

export function readJsonIfExists<T>(path: string): T | undefined {
  const raw = readTextIfExists(path);
  if (!raw) return undefined;
  return JSON.parse(raw) as T;
}

export function writeJson(path: string, data: unknown): void {
  writeTextFile(path, `${JSON.stringify(data, null, 2)}\n`);
}
