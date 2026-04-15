import { resolve } from "node:path";
import { backupFile, pathExists, readJsonIfExists, writeJson } from "../utils/fs.js";

export function configureClaudeSafe(input: { model: string; baseUrl: string; dryRun?: boolean }): { updated: boolean; note: string } {
  const target = resolve(process.cwd(), ".claude.json");

  let parsed: Record<string, unknown>;
  if (pathExists(target)) {
    const raw = readJsonIfExists<Record<string, unknown>>(target);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { updated: false, note: "Claude config format unsupported; using environment variables fallback." };
    }
    parsed = raw;
  } else {
    parsed = {};
  }

  const next = {
    ...parsed,
    apiProvider: "openai-compatible",
    apiBaseUrl: input.baseUrl,
    model: input.model,
  };

  if (!input.dryRun) {
    if (pathExists(target)) backupFile(target);
    writeJson(target, next);
  }

  return { updated: true, note: `${input.dryRun ? "Would update" : "Updated"} .claude.json.` };
}
