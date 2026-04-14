export const REGIONS: Record<string, string> = {
  "ap-southeast-1": "Asia Pacific (Singapore)",
};

export const MODELS: Record<string, { id: string; provider: string }> = {
  "glm-5.1": { id: "glm-5.1", provider: "zhipu" },
};

export function getEndpoints(region: string): { openaiCompatible: string; native: string } {
  const base = `https://api-${region}.modelarts-maas.com`;
  return { openaiCompatible: `${base}/openai/v1`, native: `${base}/v2/chat/completions` };
}
