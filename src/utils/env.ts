import os from "node:os";
import { resolve } from "node:path";
import { readJsonIfExists, readTextIfExists, writeJson, writeTextFile } from "./fs.js";
import type { EffectiveConfig } from "../types.js";

const DEFAULT_REGION = "ap-southeast-1";
const DEFAULT_MODEL = "glm-5.1";

export function getDefaultRegion(): string {
  return DEFAULT_REGION;
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}

export function makeBaseUrl(region: string): string {
  return `https://api-${region}.modelarts-maas.com/openai/v1`;
}

export function maskSecret(secret?: string): string {
  if (!secret) return "<missing>";
  if (secret.length <= 8) return "****";
  return `${secret.slice(0, 4)}****${secret.slice(-4)}`;
}

export function projectEnvPath(cwd = process.cwd()): string {
  return resolve(cwd, ".env");
}

export function globalConfigPath(): string {
  return resolve(os.homedir(), ".maas", "config.json");
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseEnv(content?: string): Record<string, string> {
  if (!content) return {};
  const out: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const idx = normalized.indexOf("=");
    if (idx < 1) continue;

    const key = normalized.slice(0, idx).trim();
    if (!key) continue;
    const value = stripWrappingQuotes(normalized.slice(idx + 1));
    out[key] = value;
  }

  return out;
}

export function stringifyEnv(values: Record<string, string>): string {
  return `${Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")}\n`;
}

export function readProjectEnv(cwd = process.cwd()): Record<string, string> {
  return parseEnv(readTextIfExists(projectEnvPath(cwd)));
}

export function readGlobalConfig(): Record<string, string> {
  return readJsonIfExists<Record<string, string>>(globalConfigPath()) ?? {};
}

export function writeProjectEnv(nextValues: Record<string, string>, cwd = process.cwd()): Record<string, string> {
  const current = readProjectEnv(cwd);
  const merged = { ...current, ...nextValues };
  writeTextFile(projectEnvPath(cwd), stringifyEnv(merged));
  return merged;
}

export function writeGlobalConfig(nextValues: Record<string, string>): Record<string, string> {
  const current = readGlobalConfig();
  const merged = { ...current, ...nextValues };
  writeJson(globalConfigPath(), merged);
  return merged;
}

export function resolveEffectiveConfig(flags: {
  apiKey?: string;
  model?: string;
  region?: string;
  baseUrl?: string;
}): EffectiveConfig {
  const project = readProjectEnv();
  const global = readGlobalConfig();

  const region = flags.region || project.MAAS_REGION || global.MAAS_REGION || DEFAULT_REGION;
  const model = flags.model || project.MAAS_MODEL || global.MAAS_MODEL || DEFAULT_MODEL;
  const baseUrl = flags.baseUrl
    || process.env.OPENAI_BASE_URL
    || project.OPENAI_BASE_URL
    || global.OPENAI_BASE_URL
    || makeBaseUrl(region);
  const apiKey = flags.apiKey || project.OPENAI_API_KEY || global.OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.MAAS_API_KEY;

  const source: EffectiveConfig["source"] = flags.apiKey || flags.model || flags.region || flags.baseUrl
    ? "flags"
    : (Object.keys(project).length > 0 ? "project" : (Object.keys(global).length > 0 ? "global" : "defaults"));

  return { apiKey, baseUrl, model, region, source };
}
