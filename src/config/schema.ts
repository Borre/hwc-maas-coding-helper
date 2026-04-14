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
  "cn-north-1": "China (Beijing)",
  "cn-north-4": "China (Beijing 4)",
  "cn-east-2": "China (Shanghai)",
  "cn-south-1": "China (Guangzhou)",
  "cn-southwest-2": "China (Guiyang 1)",
  "ap-southeast-2": "Asia Pacific (Bangkok)",
  "ap-southeast-3": "Asia Pacific (Hong Kong)",
  "eu-west-1": "Europe (Paris)",
  "af-south-1": "Africa (Johannesburg)",
  "la-north-2": "Latin America (Mexico City 2)",
  "tr-west-1": "Turkey (Istanbul)",
};

export const MODELS: Record<string, { id: string; provider: string }> = {
  "glm-5.1": { id: "glm-5.1", provider: "zhipu" },
  "glm-4-plus": { id: "glm-4-plus", provider: "zhipu" },
  "glm-4-long": { id: "glm-4-long", provider: "zhipu" },
  "glm-4-flash": { id: "glm-4-flash", provider: "zhipu" },
  "deepseek-v3": { id: "deepseek-v3", provider: "deepseek" },
  "deepseek-r1": { id: "deepseek-r1", provider: "deepseek" },
  "qwen2.5-72b": { id: "qwen2.5-72b-instruct", provider: "qwen" },
  "qwen2.5-32b": { id: "qwen2.5-32b-instruct", provider: "qwen" },
  "llama3.1-70b": { id: "llama3.1-70b", provider: "meta" },
  "mistral-large": { id: "mistral-large", provider: "mistral" },
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
