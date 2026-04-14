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
  .description("Interactive setup")
  .action(async () => {
    const opts = program.opts<{ dryRun?: boolean; verbose?: boolean; json?: boolean }>();
    await runInit(opts);
  });

program
  .command("configure")
  .description("Non-interactive configuration")
  .requiredOption("--tool <tool>", "opencode|claude|generic")
  .option("--model <model>", "model id")
  .option("--region <region>", "region id")
  .option("--api-key <apiKey>", "MaaS API key")
  .option("--project", "write to .env")
  .option("--global", "write to ~/.maas/config.json")
  .action(async (commandOpts) => {
    const opts = program.opts<{ dryRun?: boolean; verbose?: boolean; json?: boolean }>();
    await runConfigure({ ...commandOpts, ...opts });
  });

program
  .command("test")
  .description("Test MaaS OpenAI-compatible endpoint")
  .option("--model <model>")
  .option("--region <region>")
  .action(async (commandOpts) => {
    const opts = program.opts<{ dryRun?: boolean; verbose?: boolean; json?: boolean }>();
    await runTest({ ...commandOpts, ...opts });
  });

program
  .command("doctor")
  .description("Diagnose setup issues and suggest fixes")
  .action(async () => {
    const opts = program.opts<{ verbose?: boolean; json?: boolean }>();
    await runDoctor(opts);
  });

program.parseAsync(process.argv);
