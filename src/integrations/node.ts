import type { EnvironmentDetection } from "../types.js";

export function nodeSuggestion(detection: EnvironmentDetection): string | undefined {
  if (!detection.hasNode) return undefined;
  return [
    "import OpenAI from \"openai\";",
    "",
    "const client = new OpenAI({",
    "  apiKey: process.env.OPENAI_API_KEY,",
    "  baseURL: process.env.OPENAI_BASE_URL,",
    "});",
  ].join("\n");
}
