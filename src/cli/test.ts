import { getLogger } from "../utils/logger.js";
import { getEnvVar, maskKey } from "../utils/env.js";
import { getEndpoints, type MaasConfig } from "../config/schema.js";
import { chatCompletion } from "../providers/maas.js";
import chalk from "chalk";

interface TestResult {
  label: string;
  success: boolean;
  latencyMs?: number;
  content?: string;
  model?: string;
  error?: string;
}

async function executeTest(label: string, config: MaasConfig): Promise<TestResult> {
  const log = getLogger();

  log.step(`Testing ${label}...`);
  const endpoints = getEndpoints(config.region);
  const ep = config.endpointMode === "openai-compatible" ? endpoints.openaiCompatible : endpoints.native;
  log.debug(`Endpoint: ${ep}`);
  log.debug(`Model: ${config.defaultModel}`);
  log.debug(`API Key: ${maskKey(config.apiKey)}`);

  const result = await chatCompletion(
    config,
    [{ role: "user", content: "ping" }],
    { maxTokens: 16 }
  );

  return {
    label,
    success: result.success,
    latencyMs: result.latencyMs,
    content: result.content,
    model: result.model,
    error: result.error,
  };
}

function printResult(result: TestResult) {
  const log = getLogger();

  if (result.success) {
    log.success(
      `${chalk.bold(result.label)}: OK (${result.latencyMs}ms)` +
        (result.model ? ` model=${result.model}` : "")
    );
    if (result.content) {
      log.info(`  Response: "${result.content.slice(0, 80)}${result.content.length > 80 ? "..." : ""}"`);
    }
  } else {
    log.error(
      `${chalk.bold(result.label)}: FAILED` +
        (result.latencyMs ? ` (${result.latencyMs}ms)` : "")
    );
    if (result.error) {
      log.info(`  Error: ${result.error}`);
    }
  }
}

export async function runTest(options: { verbose?: boolean; native?: boolean }) {
  const log = getLogger(options.verbose);

  log.step("Running MaaS connectivity tests...");
  log.blank();

  const apiKey = getEnvVar("MAAS_API_KEY") || getEnvVar("OPENAI_API_KEY");
  if (!apiKey) {
    log.error("No API key found. Set MAAS_API_KEY or OPENAI_API_KEY, or run `maas-coding-helper init` first.");
    process.exit(1);
  }

  const region = getEnvVar("MAAS_REGION") || "ap-southeast-1";
  const defaultModel = getEnvVar("MAAS_DEFAULT_MODEL") || "glm-5.1";
  const endpoints = getEndpoints(region);

  log.info(`API Key: ${maskKey(apiKey)}`);
  log.info(`Region: ${region}`);
  log.info(`Model: ${defaultModel}`);
  log.blank();

  const results: TestResult[] = [];

  const openaiConfig: MaasConfig = {
    apiKey,
    region,
    endpointMode: "openai-compatible",
    defaultModel,
  };

  const openaiResult = await executeTest("OpenAI-compatible endpoint", openaiConfig);
  printResult(openaiResult);
  results.push(openaiResult);

  if (options.native) {
    log.blank();
    const nativeConfig: MaasConfig = {
      apiKey,
      region,
      endpointMode: "native",
      defaultModel,
    };

    const nativeResult = await executeTest("Native v2 endpoint", nativeConfig);
    printResult(nativeResult);
    results.push(nativeResult);
  }

  log.blank();
  log.step("Test summary");
  log.blank();

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  log.info(`Passed: ${chalk.green(String(passed))}  Failed: ${chalk.red(String(failed))}`);

  for (const r of results) {
    const icon = r.success ? chalk.green("✔") : chalk.red("✖");
    const latency = r.latencyMs ? ` ${r.latencyMs}ms` : "";
    log.info(`  ${icon} ${r.label}${latency}`);
  }

  if (failed > 0) {
    log.blank();
    log.error("Some tests failed. Check your API key and region.");
    process.exit(1);
  } else {
    log.blank();
    log.success("All tests passed! MaaS is ready to use.");
  }
}
