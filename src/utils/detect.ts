import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { EnvironmentDetection } from "../types.js";

function includesAny(content: string, patterns: string[]): boolean {
  return patterns.some((p) => content.includes(p));
}

export function detectEnvironment(cwd = process.cwd()): EnvironmentDetection {
  const packageJson = resolve(cwd, "package.json");
  const reqTxt = resolve(cwd, "requirements.txt");
  const pyproject = resolve(cwd, "pyproject.toml");
  const opencodePaths = [resolve(cwd, "opencode.json"), resolve(cwd, ".opencode")];
  const claudePaths = [resolve(cwd, ".claude.json"), resolve(cwd, ".claude"), resolve(cwd, "claude.json")];

  const foundFiles: string[] = [];
  const hasNode = existsSync(packageJson);
  const hasPython = existsSync(reqTxt) || existsSync(pyproject);

  if (hasNode) foundFiles.push("package.json");
  if (existsSync(reqTxt)) foundFiles.push("requirements.txt");
  if (existsSync(pyproject)) foundFiles.push("pyproject.toml");

  const hasOpenCodeConfig = opencodePaths.some((p) => existsSync(p));
  const hasClaudeConfig = claudePaths.some((p) => existsSync(p));

  if (hasOpenCodeConfig) foundFiles.push("OpenCode config");
  if (hasClaudeConfig) foundFiles.push("Claude config");

  let hasOpenAINodeUsage = false;
  if (hasNode) {
    try {
      const pkg = JSON.parse(readFileSync(packageJson, "utf8")) as Record<string, unknown>;
      const deps = {
        ...(pkg.dependencies as Record<string, string> | undefined),
        ...(pkg.devDependencies as Record<string, string> | undefined),
      };
      hasOpenAINodeUsage = typeof deps.openai === "string";
    } catch {
      // ignore
    }
  }

  let hasOpenAIPythonUsage = false;
  for (const p of [reqTxt, pyproject]) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf8");
    if (includesAny(content, ["openai", "from openai import OpenAI"])) {
      hasOpenAIPythonUsage = true;
      break;
    }
  }

  return {
    hasNode,
    hasPython,
    hasOpenCodeConfig,
    hasClaudeConfig,
    hasOpenAINodeUsage,
    hasOpenAIPythonUsage,
    foundFiles,
  };
}
