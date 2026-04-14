import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { getLogger } from "../utils/logger.js";
import { getEndpoints, type MaasConfig } from "../config/schema.js";

export function detectNodeOpenAI(): boolean {
  const log = getLogger();
  const cwd = process.cwd();
  const pkgPath = resolve(cwd, "package.json");

  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["openai"]) {
      log.debug("Found openai in package.json");
      return true;
    }
  } catch {}

  return false;
}

export function generateNodeSnippet(config: MaasConfig): string {
  const endpoints = getEndpoints(config.region);
  const baseUrl =
    config.endpointMode === "openai-compatible"
      ? endpoints.openaiCompatible
      : endpoints.native;

  if (config.endpointMode === "openai-compatible") {
    return `// MaaS via OpenAI-compatible endpoint
// Set these in your .env or environment:
// OPENAI_API_KEY=${config.apiKey.slice(0, 4)}****
// OPENAI_BASE_URL=${baseUrl}

import OpenAI from "openai";

// Option 1: Auto-detect from environment (OPENAI_API_KEY + OPENAI_BASE_URL)
const client = new OpenAI();

// Option 2: Explicit
const client = new OpenAI({
  apiKey: "${config.apiKey.slice(0, 4)}****",
  baseURL: "${baseUrl}",
});

const response = await client.chat.completions.create({
  model: "${config.defaultModel}",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);`;
  }

  return `// MaaS via native v2 endpoint
const MAAS_API_KEY = "${config.apiKey.slice(0, 4)}****";
const MAAS_BASE_URL = "${baseUrl}";

const response = await fetch(MAAS_BASE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${MAAS_API_KEY}\`,
  },
  body: JSON.stringify({
    model: "${config.defaultModel}",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

console.log(await response.json());`;
}

export function patchNodeEnv(config: MaasConfig): { path: string; vars: Record<string, string> } {
  const endpoints = getEndpoints(config.region);
  const baseUrl =
    config.endpointMode === "openai-compatible"
      ? endpoints.openaiCompatible
      : endpoints.native;

  const envPath = resolve(process.cwd(), ".env");
  const vars: Record<string, string> = {};

  if (config.endpointMode === "openai-compatible") {
    vars.OPENAI_API_KEY = config.apiKey;
    vars.OPENAI_BASE_URL = baseUrl;
  } else {
    vars.MAAS_API_KEY = config.apiKey;
    vars.MAAS_BASE_URL = baseUrl;
  }

  return { path: envPath, vars };
}

export function suggestNodePatch(config: MaasConfig): string | null {
  const log = getLogger();
  const cwd = process.cwd();

  const tsFiles = findTsFiles(cwd);
  for (const file of tsFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      if (
        content.includes('from "openai"') ||
        content.includes('require("openai")') ||
        content.includes("new OpenAI")
      ) {
        if (!content.includes("baseURL") && !content.includes("base_url")) {
          log.debug(`Found OpenAI usage without baseURL in ${file}`);
          return file;
        }
      }
    } catch {}
  }

  return null;
}

function findTsFiles(dir: string, depth = 0): string[] {
  if (depth > 2) return [];
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findTsFiles(full, depth + 1));
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}
