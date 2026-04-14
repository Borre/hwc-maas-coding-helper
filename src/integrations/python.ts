import type { EnvironmentDetection } from "../types.js";

export function pythonSuggestion(detection: EnvironmentDetection): string | undefined {
  if (!detection.hasPython) return undefined;
  return [
    "from openai import OpenAI",
    "import os",
    "",
    "client = OpenAI(",
    "    api_key=os.getenv(\"OPENAI_API_KEY\"),",
    "    base_url=os.getenv(\"OPENAI_BASE_URL\"),",
    ")",
  ].join("\n");
}
