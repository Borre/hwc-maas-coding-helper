import { resolve } from "node:path";
import { backupFile, pathExists, readJsonIfExists, writeJson } from "../utils/fs.js";

export function configureOpenCodeSafe(input: { model: string; baseUrl: string; dryRun?: boolean }): { updated: boolean; note: string } {
  const target = resolve(process.cwd(), "opencode.json");
  if (!pathExists(target)) {
    return { updated: false, note: "OpenCode config not found; using environment variables fallback." };
  }

  const parsed = readJsonIfExists<Record<string, unknown>>(target);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { updated: false, note: "OpenCode config format unsupported; using environment variables fallback." };
  }

  const next = {
    ...parsed,
    provider: "openai",
    model: input.model,
    baseURL: input.baseUrl,
  };

  if (!input.dryRun) {
    backupFile(target);
    writeJson(target, next);
  }

  return { updated: true, note: `${input.dryRun ? "Would update" : "Updated"} opencode.json safely.` };
}
