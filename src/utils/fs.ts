import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";

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

export function atomicWriteFile(path: string, content: string): void {
  ensureDirForFile(path);
  const tmpPath = `${path}.tmp.${Math.random().toString(36).slice(2)}`;
  writeFileSync(tmpPath, content, "utf8");
  renameSync(tmpPath, path);
}

export function writeTextFile(path: string, content: string): void {
  atomicWriteFile(path, content);
}

export function readJsonIfExists<T>(path: string): T | undefined {
  const raw = readTextIfExists(path);
  if (!raw) return undefined;
  return JSON.parse(raw) as T;
}

export function writeJson(path: string, data: unknown): void {
  writeTextFile(path, `${JSON.stringify(data, null, 2)}\n`);
}
