export type EndpointMode = "openai-compatible" | "native";

export interface MaasConfig {
  apiKey: string;
  region: string;
  endpointMode: EndpointMode;
  defaultModel: string;
}

export interface MaasEndpoints {
  openaiCompatible: string;
  native: string;
}

export const REGIONS: Record<string, string> = {
  "ap-southeast-1": "Asia Pacific (Singapore)",
};

export const MODELS: Record<string, { id: string; provider: string }> = {
  "deepseek-v3.2": { id: "deepseek-v3.2", provider: "deepseek" },
  "deepseek-v3.1-terminus": { id: "deepseek-v3.1-terminus", provider: "deepseek" },
  "qwen3-32b": { id: "qwen3-32b", provider: "qwen" },
  "DeepSeek-V3": { id: "DeepSeek-V3", provider: "deepseek" },
  "glm-5": { id: "glm-5", provider: "zhipu" },
  "glm-5.1": { id: "glm-5.1", provider: "zhipu" },
  "deepseek-r1-250528": { id: "deepseek-r1-250528", provider: "deepseek" },
};

export function getEndpoints(region: string): MaasEndpoints {
  const base = `https://api-${region}.modelarts-maas.com`;
  return {
    openaiCompatible: `${base}/openai/v1`,
    native: `${base}/v2/chat/completions`,
  };
}

export function getBaseUrl(config: MaasConfig): string {
  const endpoints = getEndpoints(config.region);
  return config.endpointMode === "openai-compatible"
    ? endpoints.openaiCompatible
    : endpoints.native;
}

export function getDefaultConfig(): Partial<MaasConfig> {
  return {
    region: "ap-southeast-1",
    endpointMode: "openai-compatible",
    defaultModel: "glm-5.1",
  };
}
