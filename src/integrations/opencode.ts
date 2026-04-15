import { resolve } from "node:path";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { backupFile, pathExists, readJsonIfExists, writeJson, writeTextFile } from "../utils/fs.js";
import { MODELS } from "../config/schema.js";

const MAAS_KEY_FILE = ".maas-api-key";

function writeApiKeyFile(apiKey: string): void {
  const target = resolve(process.cwd(), MAAS_KEY_FILE);
  writeTextFile(target, apiKey);
}

function ensureGitignore(): void {
  const gitignorePath = resolve(process.cwd(), ".gitignore");
  const entry = MAAS_KEY_FILE;
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf8");
    const lines = content.split(/\r?\n/);
    if (!lines.some((l) => l.trim() === entry)) {
      appendFileSync(gitignorePath, `\n${entry}\n`);
    }
  } else {
    writeFileSync(gitignorePath, `${entry}\n`);
  }
}

export function configureOpenCodeSafe(input: { model: string; baseUrl: string; apiKey?: string; dryRun?: boolean }): { updated: boolean; note: string } {
  const target = resolve(process.cwd(), "opencode.json");

  let parsed: Record<string, unknown>;
  if (pathExists(target)) {
    const raw = readJsonIfExists<Record<string, unknown>>(target);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { updated: false, note: "OpenCode config format unsupported; using environment variables fallback." };
    }
    parsed = raw;
  } else {
    parsed = {};
  }

  const provider = typeof parsed.provider === "object" && parsed.provider !== null && !Array.isArray(parsed.provider)
    ? (parsed.provider as Record<string, unknown>)
    : {};

  const existingMaas = typeof provider.maas === "object" && provider.maas !== null
    ? (provider.maas as Record<string, unknown>)
    : {};

  const existingModels = typeof existingMaas.models === "object" && existingMaas.models !== null
    ? (existingMaas.models as Record<string, unknown>)
    : {};

  const allModelEntries: Record<string, { name: string }> = {};
  for (const [id, info] of Object.entries(MODELS)) {
    if (typeof existingModels[id] === "object" && existingModels[id] !== null) {
      allModelEntries[id] = existingModels[id] as { name: string };
    } else {
      allModelEntries[id] = { name: info.name };
    }
  }

  const apiKeyRef = input.apiKey ? `{file:${MAAS_KEY_FILE}}` : `{env:OPENAI_API_KEY}`;

  const next = {
    ...parsed,
    $schema: "https://opencode.ai/config.json",
    provider: {
      ...provider,
      maas: {
        ...existingMaas,
        npm: "@ai-sdk/openai",
        name: "Huawei Cloud MaaS",
        options: {
          ...(typeof existingMaas.options === "object" && existingMaas.options !== null ? existingMaas.options as Record<string, unknown> : {}),
          baseURL: input.baseUrl,
          apiKey: apiKeyRef,
        },
        models: allModelEntries,
      },
    },
    model: `maas/${input.model}`,
  };

  if (!input.dryRun) {
    if (input.apiKey) {
      writeApiKeyFile(input.apiKey);
      ensureGitignore();
    }
    if (pathExists(target)) backupFile(target);
    writeJson(target, next);
  }

  return { updated: true, note: `${input.dryRun ? "Would update" : "Updated"} opencode.json.` };
}
