import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { getLogger } from "./logger.js";

export function ensureFile(path: string, content: string) {
  const log = getLogger();
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log.debug(`Created directory: ${dir}`);
  }
  if (!existsSync(path)) {
    writeFileSync(path, content, "utf-8");
    log.debug(`Created file: ${path}`);
    return true;
  }
  return false;
}

export function readJsonFile<T = unknown>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(path: string, data: unknown) {
  const log = getLogger();
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  log.debug(`Wrote JSON to ${path}`);
}

export function mergeJsonFile(path: string, data: Record<string, unknown>) {
  const log = getLogger();
  const existing = readJsonFile<Record<string, unknown>>(path) || {};
  const merged = { ...existing, ...data };
  writeJsonFile(path, merged);
  log.debug(`Merged JSON into ${path}`);
}

export function fileExists(path: string): boolean {
  return existsSync(resolve(path));
}

export function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

export function writeFile(path: string, content: string) {
  const log = getLogger();
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content, "utf-8");
  log.debug(`Wrote file: ${path}`);
}
