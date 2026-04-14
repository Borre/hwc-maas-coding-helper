import type { ConfigureOptions } from "../types.js";
import { Logger } from "../utils/logger.js";
import { makeBaseUrl, readGlobalConfig, readProjectEnv, writeGlobalConfig, writeProjectEnv } from "../utils/env.js";
import { configureOpenCodeSafe } from "../integrations/opencode.js";
import { configureClaudeSafe } from "../integrations/claude.js";

export async function runConfigure(options: ConfigureOptions): Promise<void> {
  const logger = new Logger(options.verbose, options.json);
  const scope = options.global ? "global" : "project";

  const project = readProjectEnv();
  const global = readGlobalConfig();
  const region = options.region || project.MAAS_REGION || global.MAAS_REGION || "ap-southeast-1";
  const model = options.model || project.MAAS_MODEL || global.MAAS_MODEL || "glm-5.1";
  const baseUrl = makeBaseUrl(region);
  const apiKey = options.apiKey || process.env.MAAS_API_KEY || process.env.OPENAI_API_KEY || project.OPENAI_API_KEY || global.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error("Missing API key. Provide --api-key or set MAAS_API_KEY / OPENAI_API_KEY.");
    process.exitCode = 1;
    return;
  }

  const vars = {
    OPENAI_API_KEY: apiKey,
    OPENAI_BASE_URL: baseUrl,
    MAAS_REGION: region,
    MAAS_MODEL: model,
  };

  if (options.dryRun) {
    logger.info(`Dry-run: would write ${scope} config.`);
  } else if (scope === "global") {
    writeGlobalConfig(vars);
    logger.success("Updated ~/.maas/config.json");
  } else {
    writeProjectEnv(vars);
    logger.success("Updated .env");
  }

  if (options.tool === "opencode") {
    const outcome = configureOpenCodeSafe({ model, baseUrl, dryRun: options.dryRun });
    outcome.updated ? logger.success(outcome.note) : logger.warn(outcome.note);
  } else if (options.tool === "claude") {
    const outcome = configureClaudeSafe({ model, baseUrl, dryRun: options.dryRun });
    outcome.updated ? logger.success(outcome.note) : logger.warn(outcome.note);
  }

  logger.info("Configuration complete.");
}
