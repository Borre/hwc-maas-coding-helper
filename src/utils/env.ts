import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { getLogger } from "./logger.js";

const DOT_ENV = ".env";
const GLOBAL_DIR = resolve(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".maas"
);
const GLOBAL_CONFIG = resolve(GLOBAL_DIR, "config.json");

export interface EnvVars {
  [key: string]: string;
}

function parseEnv(content: string): EnvVars {
  const vars: EnvVars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    vars[key] = val;
  }
  return vars;
}

function serializeEnv(vars: EnvVars): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function readEnvFile(path: string): EnvVars {
  const log = getLogger();
  if (!existsSync(path)) {
    log.debug(`No .env at ${path}`);
    return {};
  }
  const content = readFileSync(path, "utf-8");
  return parseEnv(content);
}

export function writeEnvFile(path: string, vars: EnvVars) {
  const log = getLogger();
  const existing = readEnvFile(path);
  const merged = { ...existing, ...vars };
  const content = serializeEnv(merged) + "\n";
  writeFileSync(path, content, "utf-8");
  log.debug(`Wrote ${Object.keys(vars).length} vars to ${path}`);
}

export function appendToEnvFile(path: string, vars: EnvVars) {
  const log = getLogger();
  const existing = readEnvFile(path);
  const toAdd: EnvVars = {};
  for (const [k, v] of Object.entries(vars)) {
    if (!(k in existing)) {
      toAdd[k] = v;
    } else if (existing[k] !== v) {
      toAdd[k] = v;
    }
  }
  if (Object.keys(toAdd).length === 0) {
    log.debug(`All vars already present in ${path}`);
    return;
  }
  const content = "\n" + serializeEnv(toAdd) + "\n";
  appendFileSync(path, content, "utf-8");
  log.debug(`Appended ${Object.keys(toAdd).length} vars to ${path}`);
}

export function readGlobalConfig(): EnvVars | null {
  if (!existsSync(GLOBAL_CONFIG)) return null;
  try {
    return JSON.parse(readFileSync(GLOBAL_CONFIG, "utf-8"));
  } catch {
    return null;
  }
}

export function writeGlobalConfig(vars: EnvVars) {
  const log = getLogger();
  const existing = readGlobalConfig() || {};
  const merged = { ...existing, ...vars };
  if (!existsSync(GLOBAL_DIR)) {
    mkdirSync(GLOBAL_DIR, { recursive: true });
  }
  writeFileSync(GLOBAL_CONFIG, JSON.stringify(merged, null, 2), "utf-8");
  log.debug(`Wrote global config to ${GLOBAL_CONFIG}`);
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

export function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

export function setProcessEnv(vars: EnvVars) {
  for (const [k, v] of Object.entries(vars)) {
    process.env[k] = v;
  }
}

export function getProjectEnvPath(): string {
  return resolve(process.cwd(), DOT_ENV);
}

export { GLOBAL_DIR, GLOBAL_CONFIG };
