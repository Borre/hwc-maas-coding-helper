#!/usr/bin/env node

import { Command } from "commander";
import { runInit } from "./cli/init.js";
import { runTest } from "./cli/test.js";
import { runUse } from "./cli/use.js";
import { MODELS, REGIONS, getEndpoints } from "./config/schema.js";
import { getEnvVar, maskKey } from "./utils/env.js";
import chalk from "chalk";

const program = new Command();

program
  .name("maas-coding-helper")
  .description(
    "CLI tool to use Huawei Cloud ModelArts MaaS as an OpenAI-compatible backend"
  )
  .version("1.0.0");

program
  .command("init")
  .description("Initialize MaaS configuration for your project")
  .option("--api-key <key>", "MaaS API key")
  .option("--region <region>", "Region (default: ap-southeast-1)")
  .option("--mode <mode>", "Endpoint mode: openai-compatible or native")
  .option("--verbose", "Enable verbose logging")
  .action(async (opts) => {
    await runInit({
      apiKey: opts.apiKey,
      region: opts.region,
      mode: opts.mode,
      verbose: opts.verbose,
    });
  });

program
  .command("test")
  .description("Validate MaaS connectivity and authentication")
  .option("--native", "Also test native v2 endpoint")
  .option("--verbose", "Enable verbose logging")
  .action(async (opts) => {
    await runTest({
      native: opts.native,
      verbose: opts.verbose,
    });
  });

program
  .command("use <model>")
  .description("Switch default model profile")
  .option("--verbose", "Enable verbose logging")
  .action(async (model, opts) => {
    await runUse(model, {
      verbose: opts.verbose,
    });
  });

program
  .command("models")
  .description("List available models")
  .action(() => {
    console.log(chalk.bold("Available models via MaaS:"));
    console.log();
    for (const [alias, info] of Object.entries(MODELS)) {
      console.log(
        `  ${chalk.cyan(alias.padEnd(16))} ${chalk.gray("→")} ${info.id.padEnd(24)} (${info.provider})`
      );
    }
    console.log();
    console.log(chalk.gray("Use: maas-coding-helper use <model>"));
  });

program
  .command("regions")
  .description("List available regions")
  .action(() => {
    console.log(chalk.bold("Available regions:"));
    console.log();
    for (const [id, name] of Object.entries(REGIONS)) {
      console.log(`  ${chalk.cyan(id.padEnd(20))} ${name}`);
    }
  });

program
  .command("status")
  .description("Show current configuration")
  .option("--verbose", "Enable verbose logging")
  .action((opts) => {
    const apiKey = getEnvVar("MAAS_API_KEY") || getEnvVar("OPENAI_API_KEY");
    const region = getEnvVar("MAAS_REGION") || "ap-southeast-1";
    const mode = getEnvVar("MAAS_ENDPOINT_MODE") || "openai-compatible";
    const model = getEnvVar("MAAS_DEFAULT_MODEL") || "glm-5.1";

    console.log(chalk.bold("Current MaaS configuration:"));
    console.log();

    if (!apiKey) {
      console.log(chalk.red("  No API key configured"));
      console.log();
      console.log(chalk.gray("Run `maas-coding-helper init` to set up."));
      return;
    }

    const endpoints = getEndpoints(region);

    console.log(`  API Key:     ${maskKey(apiKey)}`);
    console.log(`  Region:      ${region}`);
    console.log(`  Mode:        ${mode}`);
    console.log(`  Model:       ${model}`);
    console.log(
      `  OpenAI URL:  ${mode === "openai-compatible" ? endpoints.openaiCompatible : "N/A"}`
    );
    console.log(`  Native URL:  ${endpoints.native}`);
  });

program.parse();
