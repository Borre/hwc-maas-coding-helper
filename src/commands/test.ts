import type { TestOptions } from "../types.js";
import { Logger } from "../utils/logger.js";
import { resolveEffectiveConfig, makeBaseUrl } from "../utils/env.js";
import { testOpenAICompatible, testNative, MaaSErrorCode } from "../providers/maas.js";
import { getEndpoints } from "../config/schema.js";

export async function runTest(options: TestOptions & { native?: boolean }): Promise<void> {
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

  const result = options.native
    ? await testNative({
        apiKey: effective.apiKey,
        endpoint: getEndpoints(effective.region || "ap-southeast-1").native,
        model: effective.model,
      })
    : await testOpenAICompatible({
        apiKey: effective.apiKey,
        baseUrl: effective.baseUrl,
        model: effective.model,
      });

  if (!result.ok) {
    const codeStr = result.code ? ` [${result.code}]` : "";
    logger.error(`MaaS test failed:${codeStr} ${result.error ?? "unknown error"}`);
    
    if (result.code === MaaSErrorCode.AUTH_FAILED) {
      logger.info("Tip: Check if your API key is active and has correct permissions.");
    } else if (result.code === MaaSErrorCode.NETWORK_ERROR) {
      logger.info("Tip: Check your internet connection or if the region endpoint is reachable.");
    }
    
    logger.info(`latency_ms=${result.latencyMs}`);
    process.exitCode = 1;
    return;
  }

  logger.success(`MaaS connectivity validated (${options.native ? "native" : "openai-compatible"}).`);
  logger.info(`latency_ms=${result.latencyMs}`);
  logger.info(`preview=${result.preview || ""}`);
}
