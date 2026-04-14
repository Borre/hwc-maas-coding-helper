import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { getLogger } from "../utils/logger.js";
import { getEndpoints, type MaasConfig } from "../config/schema.js";

const LOCAL_CONFIGS = [".claude", ".claude.json", "claude.json"];
const GLOBAL_CONFIG_PATHS = [
  () => resolve(process.env.HOME || process.env.USERPROFILE || "~", ".claude"),
  () => resolve(process.env.HOME || process.env.USERPROFILE || "~", ".config", "claude", "config.json"),
];

export function findClaudeConfig(): string | null {
  const log = getLogger();
  for (const f of LOCAL_CONFIGS) {
    if (existsSync(resolve(process.cwd(), f))) {
      log.debug(`Found Claude Code config: ${f}`);
      return resolve(process.cwd(), f);
    }
  }
  for (const p of GLOBAL_CONFIG_PATHS) {
    const path = p();
    if (existsSync(path)) {
      log.debug(`Found global Claude Code config: ${path}`);
      return path;
    }
  }
  return null;
}

export function configureClaude(config: MaasConfig): { path: string; created: boolean } {
  const log = getLogger();
  const endpoints = getEndpoints(config.region);
  const baseUrl =
    config.endpointMode === "openai-compatible"
      ? endpoints.openaiCompatible
      : endpoints.native;

  const existingPath = findClaudeConfig();

  const claudeConfig = {
    apiProvider: "openai-compatible",
    apiBaseUrl: baseUrl,
    apiKey: config.apiKey,
    model: config.defaultModel,
  };

  let targetPath: string;
  let created = false;

  if (existingPath) {
    targetPath = existingPath;
    let existing: any = {};
    try {
      existing = JSON.parse(readFileSync(existingPath, "utf-8"));
    } catch {}

    existing.apiProvider = claudeConfig.apiProvider;
    existing.apiBaseUrl = claudeConfig.apiBaseUrl;
    existing.apiKey = claudeConfig.apiKey;
    existing.model = claudeConfig.model;

    writeFileSync(existingPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
    log.debug(`Updated existing Claude Code config: ${existingPath}`);
  } else {
    targetPath = resolve(process.cwd(), ".claude.json");
    const dir = dirname(targetPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(targetPath, JSON.stringify(claudeConfig, null, 2) + "\n", "utf-8");
    created = true;
    log.debug(`Created Claude Code config: ${targetPath}`);
  }

  return { path: targetPath, created };
}

export function generateClaudeEnvExport(config: MaasConfig): string {
  const endpoints = getEndpoints(config.region);
  const baseUrl =
    config.endpointMode === "openai-compatible"
      ? endpoints.openaiCompatible
      : endpoints.native;

  return [
    `export ANTHROPIC_API_KEY="${config.apiKey}"`,
    `export OPENAI_API_KEY="${config.apiKey}"`,
    `export OPENAI_BASE_URL="${baseUrl}"`,
    `export CLAUDE_CODE_USE_OPENAI=1`,
  ].join("\n");
}
