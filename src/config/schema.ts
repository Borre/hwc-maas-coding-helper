/**
 * Map of supported Huawei Cloud ModelArts MaaS regions.
 * Internal ID -> Human-readable name.
 */
export const REGIONS: Record<string, string> = {
  "ap-southeast-1": "Asia Pacific (Singapore)",
};

/**
 * Supported models and their metadata.
 * Model ID -> Provider & display name.
 */
export const MODELS: Record<string, { id: string; provider: string; name: string }> = {
  "glm-5.1": { id: "glm-5.1", provider: "zhipu", name: "GLM 5.1" },
  "glm-4.6": { id: "glm-4.6", provider: "zhipu", name: "GLM 4.6" },
  "glm-4.5": { id: "glm-4.5", provider: "zhipu", name: "GLM 4.5" },
  "deepseek-r1": { id: "deepseek-r1", provider: "deepseek", name: "DeepSeek R1" },
  "deepseek-v3": { id: "deepseek-v3", provider: "deepseek", name: "DeepSeek V3" },
  "qwen3-235b-a22b": { id: "qwen3-235b-a22b", provider: "qwen", name: "Qwen3 235B-A22B" },
  "qwen3-32b": { id: "qwen3-32b", provider: "qwen", name: "Qwen3 32B" },
  "qwen2.5-72b": { id: "qwen2.5-72b", provider: "qwen", name: "Qwen2.5 72B" },
};

/**
 * Generates endpoints for a specific region.
 * @param region The region identifier (e.g., "ap-southeast-1").
 * @returns Object containing OpenAI-compatible and native endpoints.
 */
export function getEndpoints(region: string): { openaiCompatible: string; native: string } {
  const base = `https://api-${region}.modelarts-maas.com`;
  return { openaiCompatible: `${base}/openai/v1`, native: `${base}/v2/chat/completions` };
}
