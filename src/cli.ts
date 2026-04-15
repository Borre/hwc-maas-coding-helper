#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runConfigure } from "./commands/configure.js";
import { runTest } from "./commands/test.js";
import { runDoctor } from "./commands/doctor.js";

const program = new Command();

program
  .name("maas-coding-helper")
  .description("Configure Huawei Cloud ModelArts MaaS as an OpenAI-compatible backend")
  .version("1.0.0")
  .option("--dry-run", "show planned changes without writing")
  .option("--verbose", "verbose logs")
  .option("--json", "JSON output");

program
  .command("init")
  .description("Launch interactive setup to configure MaaS API key, region, and model")
  .action(async () => {
    const opts = program.opts<{ dryRun?: boolean; verbose?: boolean; json?: boolean }>();
    await runInit(opts);
  });

program
  .command("configure")
  .description("Non-interactive configuration for CI/CD or scripts")
  .requiredOption("--tool <tool>", "Target tool (opencode|claude|generic)")
  .option("--model <model>", "MaaS model ID (e.g., glm-5.1)")
  .option("--region <region>", "MaaS region ID (e.g., ap-southeast-1)")
  .option("--api-key <apiKey>", "Huawei Cloud MaaS API key")
  .option("--project", "Write configuration to local .env file")
  .option("--global", "Write configuration to global ~/.maas/config.json")
  .action(async (commandOpts) => {
    const opts = program.opts<{ dryRun?: boolean; verbose?: boolean; json?: boolean }>();
    await runConfigure({ ...commandOpts, ...opts });
  });

program
  .command("test")
  .description("Verify connectivity and configuration with a MaaS API call")
  .option("--model <model>", "Model ID to test")
  .option("--region <region>", "Region ID to test")
  .option("--base-url <baseUrl>", "Override OpenAI-compatible base URL for testing")
  .option("--native", "Test the Huawei Cloud native endpoint instead of OpenAI-compatible")
  .action(async (commandOpts) => {
    const opts = program.opts<{ dryRun?: boolean; verbose?: boolean; json?: boolean }>();
    await runTest({ ...commandOpts, ...opts, native: Boolean(commandOpts.native) });
  });

program
  .command("doctor")
  .description("Diagnose setup issues and suggest fixes")
  .action(async () => {
    const opts = program.opts<{ verbose?: boolean; json?: boolean }>();
    await runDoctor(opts);
  });

program.parseAsync(process.argv);
