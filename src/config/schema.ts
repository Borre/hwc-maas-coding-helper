/**
 * Map of supported Huawei Cloud ModelArts MaaS regions.
 * Internal ID -> Human-readable name.
 */
export const REGIONS: Record<string, string> = {
  "ap-southeast-1": "Asia Pacific (Singapore)",
};

/**
 * Supported models and their metadata.
 * Model ID -> Provider & ID.
 */
export const MODELS: Record<string, { id: string; provider: string }> = {
  "glm-5.1": { id: "glm-5.1", provider: "zhipu" },
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
