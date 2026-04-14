import { resolve } from "node:path";
import prompts from "prompts";
import { getLogger } from "../utils/logger.js";
import { maskKey, writeEnvFile, writeGlobalConfig, getEnvVar, setProcessEnv } from "../utils/env.js";
import { detectProjectEnv, detectExistingEnvVars } from "../utils/detect.js";
import { getEndpoints, getDefaultConfig, REGIONS, MODELS, type MaasConfig, type EndpointMode } from "../config/schema.js";
import { configureOpenCode } from "../integrations/opencode.js";
import { configureClaude, generateClaudeEnvExport } from "../integrations/claude.js";
import { patchPythonEnv, generatePythonSnippet, suggestPythonPatch, detectPythonOpenAI } from "../integrations/python.js";
import { patchNodeEnv, generateNodeSnippet, suggestNodePatch, detectNodeOpenAI } from "../integrations/node.js";
import chalk from "chalk";

function parseEndpointMode(mode: string | undefined): EndpointMode | null {
  if (!mode) return null;
  if (mode === "openai-compatible" || mode === "native") {
    return mode;
  }
  return null;
}

function validateRegion(region: string | undefined): string | null {
  if (!region) return null;
  return region in REGIONS ? region : null;
}

export async function runInit(options: { verbose?: boolean; apiKey?: string; region?: string; mode?: string }) {
  const log = getLogger(options.verbose);

  log.step("Detecting environment...");
  const env = detectProjectEnv();

  log.blank();
  log.info(`Project type: ${chalk.bold(env.type)}`);
  if (env.indicators.length > 0) {
    log.info(`Detected: ${env.indicators.join(", ")}`);
  }
  if (env.hasOpenCode) log.info("OpenCode configuration detected");
  if (env.hasClaudeCode) log.info("Claude Code configuration detected");
  if (env.hasOpenAI) log.info("OpenAI SDK detected");

  const existingEnv = detectExistingEnvVars();
  const existingKeys = Object.keys(existingEnv);
  if (existingKeys.length > 0) {
    log.blank();
    log.warn("Existing environment variables found:");
    for (const [k, v] of Object.entries(existingEnv)) {
      log.info(`  ${k}=${k.includes("KEY") ? maskKey(v) : v}`);
    }
  }

  log.blank();
  log.step("Configuration");

  const defaults = getDefaultConfig();

  const apiKeyInput =
    options.apiKey ||
    getEnvVar("MAAS_API_KEY") ||
    getEnvVar("OPENAI_API_KEY") ||
    "";

  const validatedRegion = validateRegion(options.region);
  if (options.region && !validatedRegion) {
    log.error(`Unsupported region: ${options.region}`);
    log.info(`Supported regions: ${Object.keys(REGIONS).join(", ")}`);
    process.exit(1);
  }

  const validatedMode = parseEndpointMode(options.mode);
  if (options.mode && !validatedMode) {
    log.error(`Unsupported mode: ${options.mode}`);
    log.info("Supported modes: openai-compatible, native");
    process.exit(1);
  }

  const regionInput = validatedRegion || defaults.region;
  const modeInput = validatedMode || defaults.endpointMode;

  const answers = await prompts(
    [
      {
        type: apiKeyInput ? null : "text",
        name: "apiKey",
        message: "MaaS API Key",
        initial: "",
      },
      {
        type: "select",
        name: "region",
        message: "Region",
        choices: Object.entries(REGIONS).map(([value, title]) => ({
          title: `${title} (${value})`,
          value,
        })),
        initial: Object.keys(REGIONS).indexOf(regionInput || "ap-southeast-1"),
      },
      {
        type: "select",
        name: "endpointMode",
        message: "Endpoint mode",
        choices: [
          { title: "OpenAI-compatible (recommended)", value: "openai-compatible" },
          { title: "Native v2", value: "native" },
        ],
        initial: modeInput === "native" ? 1 : 0,
      },
      {
        type: "select",
        name: "defaultModel",
        message: "Default model",
        choices: Object.entries(MODELS).map(([key, val]) => ({
          title: `${key} (${val.provider})`,
          value: val.id,
        })),
        initial: 0,
      },
    ],
    {
      onCancel: () => {
        log.warn("Aborted");
        process.exit(1);
      },
    }
  );

  const config: MaasConfig = {
    apiKey: answers.apiKey || apiKeyInput,
    region: answers.region || regionInput,
    endpointMode: (answers.endpointMode || modeInput) as EndpointMode,
    defaultModel: answers.defaultModel || defaults.defaultModel!,
  };

  if (!config.apiKey) {
    log.error("API key is required. Set MAAS_API_KEY or provide via --api-key");
    process.exit(1);
  }

  const endpoints = getEndpoints(config.region);

  log.blank();
  log.step("Applying configuration...");

  const envVars: Record<string, string> = {};

  if (config.endpointMode === "openai-compatible") {
    envVars.OPENAI_API_KEY = config.apiKey;
    envVars.OPENAI_BASE_URL = endpoints.openaiCompatible;
    envVars.MAAS_API_KEY = config.apiKey;
    envVars.MAAS_REGION = config.region;
    envVars.MAAS_ENDPOINT_MODE = config.endpointMode;
    envVars.MAAS_DEFAULT_MODEL = config.defaultModel;
  } else {
    envVars.MAAS_API_KEY = config.apiKey;
    envVars.MAAS_BASE_URL = endpoints.native;
    envVars.MAAS_REGION = config.region;
    envVars.MAAS_ENDPOINT_MODE = config.endpointMode;
    envVars.MAAS_DEFAULT_MODEL = config.defaultModel;
  }

  setProcessEnv(envVars);

  const envPath = resolve(process.cwd(), ".env");
  writeEnvFile(envPath, envVars);
  log.success(`Wrote .env with ${Object.keys(envVars).length} variables`);

  writeGlobalConfig({
    MAAS_API_KEY: config.apiKey,
    MAAS_REGION: config.region,
    MAAS_ENDPOINT_MODE: config.endpointMode,
    MAAS_DEFAULT_MODEL: config.defaultModel,
  });
  log.success("Updated global config (~/.maas/config.json)");

  log.blank();
  log.step("Configuring integrations...");

  const filesModified: string[] = [".env", "~/.maas/config.json"];

  if (env.hasOpenCode || (!env.hasClaudeCode && env.type === "unknown")) {
    const result = configureOpenCode(config);
    if (result.created) {
      log.success(`Created OpenCode config: ${result.path}`);
    } else {
      log.success(`Updated OpenCode config: ${result.path}`);
    }
    filesModified.push(result.path);
  }

  if (env.hasClaudeCode) {
    const result = configureClaude(config);
    if (result.created) {
      log.success(`Created Claude Code config: ${result.path}`);
    } else {
      log.success(`Updated Claude Code config: ${result.path}`);
    }
    filesModified.push(result.path);
  }

  if (env.type === "python") {
    const { path: pPath, vars: pVars } = patchPythonEnv(config);
    writeEnvFile(pPath, pVars);
    log.success("Python environment configured");

    if (detectPythonOpenAI()) {
      const patchFile = suggestPythonPatch(config);
      if (patchFile) {
        log.warn(`Python file ${patchFile} uses OpenAI without base_url`);
        log.info("  Add: client = OpenAI(base_url=os.environ['OPENAI_BASE_URL'])");
      }
    }
  }

  if (env.type === "node") {
    const { path: nPath, vars: nVars } = patchNodeEnv(config);
    writeEnvFile(nPath, nVars);
    log.success("Node.js environment configured");

    if (detectNodeOpenAI()) {
      const patchFile = suggestNodePatch(config);
      if (patchFile) {
        log.warn(`Node file ${patchFile} uses OpenAI without baseURL`);
        log.info("  Add: new OpenAI({ baseURL: process.env.OPENAI_BASE_URL })");
      }
    }
  }

  log.blank();
  log.step("Summary");
  log.blank();
  log.table({
    "API Key": maskKey(config.apiKey),
    Region: config.region,
    Mode: config.endpointMode,
    Model: config.defaultModel,
    "OpenAI Base URL": config.endpointMode === "openai-compatible" ? endpoints.openaiCompatible : "N/A (native mode)",
    "Native URL": endpoints.native,
  });

  log.blank();
  log.step("Files modified");
  for (const f of filesModified) {
    log.info(`  ${f}`);
  }

  log.blank();
  log.step("Usage examples");
  log.blank();

  if (config.endpointMode === "openai-compatible") {
    log.info(chalk.bold("Python:"));
    log.info(generatePythonSnippet(config));
    log.blank();
    log.info(chalk.bold("Node.js:"));
    log.info(generateNodeSnippet(config));
    log.blank();
    log.info(chalk.bold("OpenCode / Claude Code:"));
    log.info("  → Using " + config.defaultModel + " via MaaS automatically");
    log.blank();
    log.info(chalk.bold("Any OpenAI-compatible tool:"));
    log.info(`  OPENAI_API_KEY=${maskKey(config.apiKey)} OPENAI_BASE_URL=${endpoints.openaiCompatible}`);
  } else {
    log.info(chalk.bold("Python (native):"));
    log.info(generatePythonSnippet(config));
    log.blank();
    log.info(chalk.bold("Node.js (native):"));
    log.info(generateNodeSnippet(config));
  }

  if (env.hasClaudeCode) {
    log.blank();
    log.info(chalk.bold("Claude Code env export:"));
    log.info(generateClaudeEnvExport(config));
  }

  log.blank();
  log.success("Done! Run `maas-coding-helper test` to validate your setup.");
}
