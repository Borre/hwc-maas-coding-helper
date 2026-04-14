import prompts from "prompts";
import type { InitOptions } from "../types.js";
import { Logger } from "../utils/logger.js";
import { detectEnvironment } from "../utils/detect.js";
import { getDefaultModel, getDefaultRegion } from "../utils/env.js";
import { runConfigure } from "./configure.js";
import { runTest } from "./test.js";
import { pythonSuggestion } from "../integrations/python.js";
import { nodeSuggestion } from "../integrations/node.js";

export async function runInit(options: InitOptions): Promise<void> {
  const logger = new Logger(options.verbose, options.json);
  const detected = detectEnvironment();

  logger.info(`Environment detected: ${detected.foundFiles.join(", ") || "none"}`);

  const answers = await prompts([
    {
      type: "password",
      name: "apiKey",
      message: "MaaS API key",
      validate: (value: string) => value.trim().length > 0 ? true : "API key required",
    },
    {
      type: "text",
      name: "region",
      message: "Region",
      initial: getDefaultRegion(),
    },
    {
      type: "text",
      name: "model",
      message: "Model",
      initial: getDefaultModel(),
    },
    {
      type: "select",
      name: "scope",
      message: "Config scope",
      choices: [
        { title: "Project (.env)", value: "project" },
        { title: "Global (~/.maas/config.json)", value: "global" },
      ],
      initial: 0,
    },
    {
      type: "select",
      name: "tool",
      message: "Primary coding tool",
      choices: [
        { title: "Generic (env only)", value: "generic" },
        { title: "OpenCode", value: "opencode" },
        { title: "Claude Code", value: "claude" },
      ],
      initial: 0,
    },
  ]);

  await runConfigure({
    tool: answers.tool,
    apiKey: answers.apiKey,
    model: answers.model,
    region: answers.region,
    project: answers.scope === "project",
    global: answers.scope === "global",
    dryRun: options.dryRun,
    verbose: options.verbose,
    json: options.json,
  });

  await runTest({ dryRun: options.dryRun, verbose: options.verbose, json: options.json });

  const py = pythonSuggestion(detected);
  const node = nodeSuggestion(detected);
  if (py) logger.info(`Python example:\n${py}`);
  if (node) logger.info(`Node example:\n${node}`);
}
