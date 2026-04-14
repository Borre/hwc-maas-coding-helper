import type { DoctorOptions } from "../types.js";
import { Logger } from "../utils/logger.js";
import { detectEnvironment } from "../utils/detect.js";
import { readGlobalConfig, readProjectEnv } from "../utils/env.js";

export async function runDoctor(options: DoctorOptions): Promise<void> {
  const logger = new Logger(options.verbose, options.json);
  const detection = detectEnvironment();
  const project = readProjectEnv();
  const global = readGlobalConfig();

  const findings: string[] = [];
  const fixes: string[] = [];

  const hasProjectKey = Boolean(project.OPENAI_API_KEY);
  const hasGlobalKey = Boolean(global.OPENAI_API_KEY);
  const hasProjectUrl = Boolean(project.OPENAI_BASE_URL);
  const hasGlobalUrl = Boolean(global.OPENAI_BASE_URL);

  if (!hasProjectKey && !hasGlobalKey) {
    findings.push("Missing OPENAI_API_KEY in project and global config.");
    fixes.push("Run: npx maas-coding-helper init");
  }

  if (!hasProjectUrl && !hasGlobalUrl) {
    findings.push("Missing OPENAI_BASE_URL in project and global config.");
    fixes.push("Run: npx maas-coding-helper configure --project");
  }

  if ((hasProjectKey && !hasProjectUrl) || (!hasProjectKey && hasProjectUrl)) {
    findings.push("Partial project setup in .env (key/url mismatch).");
    fixes.push("Run: npx maas-coding-helper configure --project");
  }

  if ((hasGlobalKey && !hasGlobalUrl) || (!hasGlobalKey && hasGlobalUrl)) {
    findings.push("Partial global setup in ~/.maas/config.json (key/url mismatch).");
    fixes.push("Run: npx maas-coding-helper configure --global");
  }

  if (project.OPENAI_BASE_URL && global.OPENAI_BASE_URL && project.OPENAI_BASE_URL !== global.OPENAI_BASE_URL) {
    findings.push("Conflicting project/global OPENAI_BASE_URL values.");
    fixes.push("Pick one scope and re-run configure.");
  }

  logger.info(`Detected files: ${detection.foundFiles.join(", ") || "none"}`);

  if (findings.length === 0) {
    logger.success("Doctor check passed: no critical issues found.");
    return;
  }

  findings.forEach((f) => logger.warn(f));
  Array.from(new Set(fixes)).forEach((f) => logger.info(`Fix: ${f}`));
  process.exitCode = 1;
}
