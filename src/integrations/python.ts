import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { getLogger } from "../utils/logger.js";
import { getEndpoints, type MaasConfig } from "../config/schema.js";

export function detectPythonOpenAI(): boolean {
  const log = getLogger();
  const cwd = process.cwd();

  const files = ["requirements.txt", "Pipfile", "pyproject.toml"];
  for (const f of files) {
    const path = resolve(cwd, f);
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, "utf-8");
        if (content.includes("openai")) {
          log.debug(`Found openai in ${f}`);
          return true;
        }
      } catch {}
    }
  }

  return false;
}

export function generatePythonSnippet(config: MaasConfig): string {
  const endpoints = getEndpoints(config.region);
  const baseUrl =
    config.endpointMode === "openai-compatible"
      ? endpoints.openaiCompatible
      : endpoints.native;

  if (config.endpointMode === "openai-compatible") {
    return `# MaaS via OpenAI-compatible endpoint
# Set these in your .env or environment:
# OPENAI_API_KEY=${config.apiKey.slice(0, 4)}****
# OPENAI_BASE_URL=${baseUrl}

from openai import OpenAI

# Option 1: Auto-detect from environment (OPENAI_API_KEY + OPENAI_BASE_URL)
client = OpenAI()

# Option 2: Explicit
client = OpenAI(
    api_key="${config.apiKey.slice(0, 4)}****",
    base_url="${baseUrl}",
)

response = client.chat.completions.create(
    model="${config.defaultModel}",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(response.choices[0].message.content)`;
  }

  return `# MaaS via native v2 endpoint
import httpx

MAAS_API_KEY = "${config.apiKey.slice(0, 4)}****"
MAAS_BASE_URL = "${baseUrl}"

response = httpx.post(
    MAAS_BASE_URL,
    headers={"Authorization": f"Bearer {MAAS_API_KEY}"},
    json={
        "model": "${config.defaultModel}",
        "messages": [{"role": "user", "content": "Hello!"}],
    },
)

print(response.json())`;
}

export function patchPythonEnv(config: MaasConfig): { path: string; vars: Record<string, string> } {
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

export function suggestPythonPatch(config: MaasConfig): string | null {
  const log = getLogger();
  const cwd = process.cwd();

  const pyFiles = findPythonFiles(cwd);
  for (const file of pyFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      if (content.includes("from openai import OpenAI") || content.includes("import openai")) {
        if (!content.includes("base_url") && !content.includes("baseURL")) {
          log.debug(`Found OpenAI import without base_url in ${file}`);
          return file;
        }
      }
    } catch {}
  }

  return null;
}

function findPythonFiles(dir: string, depth = 0): string[] {
  if (depth > 2) return [];
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__") continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findPythonFiles(full, depth + 1));
      } else if (entry.name.endsWith(".py")) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}
