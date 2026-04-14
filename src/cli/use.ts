import { resolve } from "node:path";
import { getLogger } from "../utils/logger.js";
import { getEnvVar, writeEnvFile, setProcessEnv } from "../utils/env.js";
import { MODELS, getEndpoints, type MaasConfig } from "../config/schema.js";
import chalk from "chalk";

export async function runUse(modelAlias: string, options: { verbose?: boolean }) {
  const log = getLogger(options.verbose);

  const apiKey = getEnvVar("MAAS_API_KEY") || getEnvVar("OPENAI_API_KEY");
  if (!apiKey) {
    log.error("No API key found. Run `maas-coding-helper init` first.");
    process.exit(1);
  }

  const region = getEnvVar("MAAS_REGION") || "ap-southeast-1";
  const endpointMode = (getEnvVar("MAAS_ENDPOINT_MODE") || "openai-compatible") as "openai-compatible" | "native";

  const modelEntry = MODELS[modelAlias];
  if (!modelEntry) {
    log.error(`Unknown model: ${modelAlias}`);
    log.blank();
    log.info("Available models:");
    for (const [alias, info] of Object.entries(MODELS)) {
      log.info(`  ${chalk.bold(alias)} → ${info.id} (${info.provider})`);
    }
    process.exit(1);
  }

  const config: MaasConfig = {
    apiKey,
    region,
    endpointMode,
    defaultModel: modelEntry.id,
  };

  const endpoints = getEndpoints(region);
  const baseUrl = endpointMode === "openai-compatible" ? endpoints.openaiCompatible : endpoints.native;

  const envVars: Record<string, string> = {
    MAAS_DEFAULT_MODEL: modelEntry.id,
  };

  if (endpointMode === "openai-compatible") {
    envVars.OPENAI_API_KEY = apiKey;
    envVars.OPENAI_BASE_URL = baseUrl;
  }

  setProcessEnv(envVars);

  const envPath = resolve(process.cwd(), ".env");
  writeEnvFile(envPath, envVars);

  log.success(`Switched to ${chalk.bold(modelAlias)} (${modelEntry.id})`);
  log.blank();
  log.table({
    Model: modelEntry.id,
    Provider: modelEntry.provider,
    Endpoint: endpointMode,
    "Base URL": baseUrl,
  });
}
