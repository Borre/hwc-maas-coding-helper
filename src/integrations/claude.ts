import { resolve } from "node:path";
import { backupFile, pathExists, readJsonIfExists, writeJson } from "../utils/fs.js";

export function configureClaudeSafe(input: { model: string; baseUrl: string; dryRun?: boolean }): { updated: boolean; note: string } {
  const target = resolve(process.cwd(), ".claude.json");
  if (!pathExists(target)) {
    return { updated: false, note: "Claude Code config not found; using environment variables fallback." };
  }

  const parsed = readJsonIfExists<Record<string, unknown>>(target);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { updated: false, note: "Claude config format unsupported; using environment variables fallback." };
  }

  const next = {
    ...parsed,
    apiProvider: "openai-compatible",
    apiBaseUrl: input.baseUrl,
    model: input.model,
  };

  if (!input.dryRun) {
    backupFile(target);
    writeJson(target, next);
  }

  return { updated: true, note: `${input.dryRun ? "Would update" : "Updated"} .claude.json safely.` };
}
