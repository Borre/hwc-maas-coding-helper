import type { TestOptions } from "../types.js";
import { Logger } from "../utils/logger.js";
import { resolveEffectiveConfig } from "../utils/env.js";
import { testOpenAICompatible } from "../providers/maas.js";

export async function runTest(options: TestOptions): Promise<void> {
  const logger = new Logger(options.verbose, options.json);
  const effective = resolveEffectiveConfig({ model: options.model, region: options.region, baseUrl: options.baseUrl });

  if (!effective.apiKey) {
    logger.error("No API key resolved. Run init/configure first.");
    process.exitCode = 1;
    return;
  }

  if (options.dryRun) {
    logger.info("Dry-run: skipped network test.");
    return;
  }

  const result = await testOpenAICompatible({
    apiKey: effective.apiKey,
    baseUrl: effective.baseUrl,
    model: effective.model,
  });

  if (!result.ok) {
    logger.error(`MaaS test failed: ${result.error ?? "unknown error"}`);
    logger.info(`latency_ms=${result.latencyMs}`);
    process.exitCode = 1;
    return;
  }

  logger.success("MaaS connectivity validated.");
  logger.info(`latency_ms=${result.latencyMs}`);
  logger.info(`preview=${result.preview || ""}`);
}
