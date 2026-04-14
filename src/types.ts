export type ToolTarget = "opencode" | "claude" | "generic";

export interface EffectiveConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  region: string;
  source: "flags" | "project" | "global" | "defaults";
}

export interface ConfigureOptions {
  tool: ToolTarget;
  model?: string;
  region?: string;
  project?: boolean;
  global?: boolean;
  apiKey?: string;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
}

export interface InitOptions {
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
}

export interface TestOptions {
  model?: string;
  region?: string;
  baseUrl?: string;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
}

export interface DoctorOptions {
  verbose?: boolean;
  json?: boolean;
}

export interface EnvironmentDetection {
  hasNode: boolean;
  hasPython: boolean;
  hasOpenCodeConfig: boolean;
  hasClaudeConfig: boolean;
  hasOpenAIPythonUsage: boolean;
  hasOpenAINodeUsage: boolean;
  foundFiles: string[];
}
