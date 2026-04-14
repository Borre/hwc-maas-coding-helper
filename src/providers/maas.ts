import { getEndpoints, getBaseUrl, type MaasConfig } from "../config/schema.js";
import { maskKey, getEnvVar } from "../utils/env.js";
import { getLogger } from "../utils/logger.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MaasResponse {
  success: boolean;
  content?: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs?: number;
  error?: string;
  raw?: unknown;
}

export async function chatCompletion(
  config: MaasConfig,
  messages: ChatMessage[],
  options?: { model?: string; maxTokens?: number }
): Promise<MaasResponse> {
  const log = getLogger();
  const baseUrl = getBaseUrl(config);
  const model = options?.model || config.defaultModel;

  const isNative = config.endpointMode === "native";
  const url = isNative ? baseUrl : `${baseUrl}/chat/completions`;

  const body = {
    model,
    messages,
    max_tokens: options?.maxTokens || 256,
  };

  log.debug(`POST ${url}`);
  log.debug(`Model: ${model}`);
  log.debug(`API Key: ${maskKey(config.apiKey)}`);

  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - start;
    const raw = await response.json();

    if (!response.ok) {
      const errMsg =
        (raw as any)?.error?.message ||
        (raw as any)?.message ||
        `HTTP ${response.status}`;
      log.debug(`Error response: ${JSON.stringify(raw)}`);
      return {
        success: false,
        latencyMs,
        error: errMsg,
        raw,
      };
    }

    const choice = (raw as any)?.choices?.[0];
    const content = choice?.message?.content || "";
    const usage = (raw as any)?.usage;

    return {
      success: true,
      content,
      model: (raw as any)?.model || model,
      usage: usage
        ? {
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            total_tokens: usage.total_tokens || 0,
          }
        : undefined,
      latencyMs,
      raw,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      latencyMs,
      error: err.message || String(err),
    };
  }
}

export async function validateApiKey(
  config: MaasConfig
): Promise<{ valid: boolean; error?: string }> {
  const result = await chatCompletion(
    config,
    [{ role: "user", content: "ping" }],
    { maxTokens: 8 }
  );

  if (result.success) {
    return { valid: true };
  }

  return { valid: false, error: result.error };
}

export function resolveApiKey(explicit?: string): string | undefined {
  return (
    explicit ||
    getEnvVar("MAAS_API_KEY") ||
    getEnvVar("OPENAI_API_KEY")
  );
}
