import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { getLogger } from "../utils/logger.js";
import { getEndpoints, type MaasConfig } from "../config/schema.js";
import YAML from "yaml";

export interface OpenCodeConfig {
  provider: string;
  model: string;
  baseURL?: string;
  apiKey?: string;
}

const LOCAL_CONFIGS = [
  ".opencode",
  "opencode.json",
  "opencode.yaml",
  "opencode.yml",
];

const GLOBAL_CONFIG_PATHS = [
  () => resolve(process.env.HOME || process.env.USERPROFILE || "~", ".opencode"),
  () => resolve(process.env.HOME || process.env.USERPROFILE || "~", ".config", "opencode", "config.json"),
];

function backupPath(path: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${path}.bak.${timestamp}`;
}

function parseOpenCodeConfig(path: string, content: string): Record<string, unknown> {
  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return (YAML.parse(content) || {}) as Record<string, unknown>;
  }

  if (path.endsWith(".json")) {
    return JSON.parse(content) as Record<string, unknown>;
  }

  // `.opencode` can be JSON or YAML depending on user setup.
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return (YAML.parse(content) || {}) as Record<string, unknown>;
  }
}

function stringifyOpenCodeConfig(path: string, data: Record<string, unknown>): string {
  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return YAML.stringify(data);
  }
  return JSON.stringify(data, null, 2) + "\n";
}

export function findOpenCodeConfig(): string | null {
  const log = getLogger();
  for (const f of LOCAL_CONFIGS) {
    if (existsSync(resolve(process.cwd(), f))) {
      log.debug(`Found OpenCode config: ${f}`);
      return resolve(process.cwd(), f);
    }
  }
  for (const p of GLOBAL_CONFIG_PATHS) {
    const path = p();
    if (existsSync(path)) {
      log.debug(`Found global OpenCode config: ${path}`);
      return path;
    }
  }
  return null;
}

export function configureOpenCode(config: MaasConfig): { path: string; created: boolean } {
  const log = getLogger();
  const endpoints = getEndpoints(config.region);
  const baseUrl =
    config.endpointMode === "openai-compatible"
      ? endpoints.openaiCompatible
      : endpoints.native;

  const existingPath = findOpenCodeConfig();

  const opencodeConfig = {
    provider: "openai",
    model: config.defaultModel,
    baseURL: baseUrl,
    apiKey: config.apiKey,
  };

  let targetPath: string;
  let created = false;

  if (existingPath) {
    targetPath = existingPath;
    const content = readFileSync(existingPath, "utf-8");
    let existing: Record<string, unknown>;
    try {
      existing = parseOpenCodeConfig(existingPath, content);
    } catch (err: any) {
      throw new Error(`Unable to parse OpenCode config at ${existingPath}: ${err.message || String(err)}`);
    }

    existing.provider = opencodeConfig.provider;
    existing.model = opencodeConfig.model;
    existing.baseURL = opencodeConfig.baseURL;
    existing.apiKey = opencodeConfig.apiKey;

    const backup = backupPath(existingPath);
    writeFileSync(backup, content, "utf-8");
    log.debug(`Created OpenCode config backup: ${backup}`);

    writeFileSync(existingPath, stringifyOpenCodeConfig(existingPath, existing), "utf-8");
    log.debug(`Updated existing OpenCode config: ${existingPath}`);
  } else {
    targetPath = resolve(process.cwd(), "opencode.json");
    const dir = dirname(targetPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, JSON.stringify(opencodeConfig, null, 2) + "\n", "utf-8");
    created = true;
    log.debug(`Created OpenCode config: ${targetPath}`);
  }

  return { path: targetPath, created };
}
