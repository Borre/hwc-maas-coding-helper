import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { getLogger } from "./logger.js";

export interface ProjectEnv {
  type: "python" | "node" | "unknown";
  indicators: string[];
  hasOpenCode: boolean;
  hasClaudeCode: boolean;
  hasOpenAI: boolean;
}

export function detectProjectEnv(): ProjectEnv {
  const log = getLogger();
  const cwd = process.cwd();
  const result: ProjectEnv = {
    type: "unknown",
    indicators: [],
    hasOpenCode: false,
    hasClaudeCode: false,
    hasOpenAI: false,
  };

  const has = (f: string) => existsSync(resolve(cwd, f));

  if (has("package.json")) {
    result.type = "node";
    result.indicators.push("package.json");
    log.debug("Detected Node.js project (package.json)");
  }

  if (has("requirements.txt")) {
    if (result.type === "unknown") result.type = "python";
    result.indicators.push("requirements.txt");
    log.debug("Detected Python project (requirements.txt)");
  }

  if (has("pyproject.toml")) {
    if (result.type === "unknown") result.type = "python";
    result.indicators.push("pyproject.toml");
    log.debug("Detected Python project (pyproject.toml)");
  }

  if (has("setup.py") || has("setup.cfg")) {
    if (result.type === "unknown") result.type = "python";
    result.indicators.push("setup.py / setup.cfg");
  }

  if (has("Pipfile")) {
    if (result.type === "unknown") result.type = "python";
    result.indicators.push("Pipfile");
  }

  if (has(".opencode") || has("opencode.json") || has("opencode.yaml")) {
    result.hasOpenCode = true;
    result.indicators.push("OpenCode config");
    log.debug("Detected OpenCode configuration");
  }

  const home = process.env.HOME || process.env.USERPROFILE || "";
  if (
    existsSync(resolve(home, ".opencode")) ||
    existsSync(resolve(home, ".config", "opencode"))
  ) {
    result.hasOpenCode = true;
    result.indicators.push("OpenCode (global)");
    log.debug("Detected global OpenCode configuration");
  }

  if (has(".claude") || has(".claude.json") || has("claude.json")) {
    result.hasClaudeCode = true;
    result.indicators.push("Claude Code config");
    log.debug("Detected Claude Code configuration");
  }

  if (
    existsSync(resolve(home, ".claude")) ||
    existsSync(resolve(home, ".config", "claude"))
  ) {
    result.hasClaudeCode = true;
    result.indicators.push("Claude Code (global)");
    log.debug("Detected global Claude Code configuration");
  }

  if (has("openai.yaml") || has("openai.json")) {
    result.hasOpenAI = true;
    result.indicators.push("OpenAI config");
  }

  if (result.type === "node" && has("package.json")) {
    try {
      const pkg = JSON.parse(readFileSync(resolve(cwd, "package.json"), "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["openai"]) {
        result.hasOpenAI = true;
        result.indicators.push("openai (npm)");
      }
    } catch {}
  }

  if (result.type === "python") {
    const reqFiles = ["requirements.txt", "Pipfile"];
    for (const f of reqFiles) {
      if (has(f)) {
        try {
          const content = readFileSync(resolve(cwd, f), "utf-8");
          if (content.includes("openai")) {
            result.hasOpenAI = true;
            result.indicators.push("openai (pip)");
          }
        } catch {}
      }
    }
  }

  return result;
}

export function detectExistingEnvVars(): Record<string, string> {
  const cwd = process.cwd();
  const envPath = resolve(cwd, ".env");
  const vars: Record<string, string> = {};

  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (
          key.startsWith("OPENAI_") ||
          key.startsWith("MAAS_") ||
          key === "OPENAI_API_KEY" ||
          key === "OPENAI_BASE_URL"
        ) {
          vars[key] = val;
        }
      }
    } catch {}
  }

  return vars;
}
