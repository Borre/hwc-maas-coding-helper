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
 * Updated 2026-04-16 to match current MaaS API availability.
 */
export const MODELS: Record<string, { id: string; provider: string; name: string }> = {
  "glm-5.1": { id: "glm-5.1", provider: "zhipu", name: "GLM 5.1" },
  "glm-5": { id: "glm-5", provider: "zhipu", name: "GLM 5" },
  "DeepSeek-V3": { id: "DeepSeek-V3", provider: "deepseek", name: "DeepSeek V3" },
  "deepseek-v3.2": { id: "deepseek-v3.2", provider: "deepseek", name: "DeepSeek V3.2" },
  "deepseek-v3.1-terminus": { id: "deepseek-v3.1-terminus", provider: "deepseek", name: "DeepSeek V3.1 Terminus" },
  "deepseek-r1-250528": { id: "deepseek-r1-250528", provider: "deepseek", name: "DeepSeek R1 250528" },
  "qwen3-32b": { id: "qwen3-32b", provider: "qwen", name: "Qwen3 32B" },
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
