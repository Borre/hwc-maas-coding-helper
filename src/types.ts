/**
 * Supported integration targets for the CLI.
 */
export type ToolTarget = "opencode" | "claude" | "generic";

/**
 * The final resolved configuration used for API calls.
 */
export interface EffectiveConfig {
  /** MaaS API key (OPENAI_API_KEY) */
  apiKey?: string;
  /** MaaS OpenAI-compatible base URL */
  baseUrl: string;
  /** Target Model ID (e.g., glm-5.1) */
  model: string;
  /** Region ID (e.g., ap-southeast-1) */
  region: string;
  /** Source from which the config was resolved */
  source: "flags" | "project" | "global" | "defaults";
}

/**
 * Options for the non-interactive 'configure' command.
 */
export interface ConfigureOptions {
  /** The tool to configure (Claude Code, OpenCode, or Generic) */
  tool: ToolTarget;
  /** Optional Model ID override */
  model?: string;
  /** Optional Region ID override */
  region?: string;
  /** Whether to write to project .env */
  project?: boolean;
  /** Whether to write to global ~/.maas/config.json */
  global?: boolean;
  /** MaaS API key */
  apiKey?: string;
  /** Don't write changes, just show them */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Options for the interactive 'init' command.
 */
export interface InitOptions {
  /** Don't write changes, just show them */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Options for the 'test' command.
 */
export interface TestOptions {
  /** Model ID to test */
  model?: string;
  /** Region ID to test */
  region?: string;
  /** Custom Base URL override */
  baseUrl?: string;
  /** Skip network test */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Options for the 'doctor' command.
 */
export interface DoctorOptions {
  /** Enable verbose logging */
  verbose?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Results from environment detection.
 */
export interface EnvironmentDetection {
  /** Detected node project (package.json) */
  hasNode: boolean;
  /** Detected python project (requirements.txt or pyproject.toml) */
  hasPython: boolean;
  /** Detected opencode config files */
  hasOpenCodeConfig: boolean;
  /** Detected claude code config files */
  hasClaudeConfig: boolean;
  /** Detected openai python sdk usage */
  hasOpenAIPythonUsage: boolean;
  /** Detected openai node sdk usage */
  hasOpenAINodeUsage: boolean;
  /** List of detected filenames */
  foundFiles: string[];
}
