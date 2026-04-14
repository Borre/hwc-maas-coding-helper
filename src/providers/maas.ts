export interface MaaSTestResult {
  ok: boolean;
  status?: number;
  latencyMs: number;
  preview?: string;
  error?: string;
}

export async function testOpenAICompatible(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
}): Promise<MaaSTestResult> {
  const started = Date.now();
  try {
    const res = await fetch(`${input.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [{ role: "user", content: "Reply with: pong" }],
        max_tokens: 24,
      }),
    });

    const latencyMs = Date.now() - started;
    const data = (await res.json()) as Record<string, any>;
    const preview = data?.choices?.[0]?.message?.content;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        latencyMs,
        error: data?.error?.message || `HTTP ${res.status}`,
      };
    }

    if (!Array.isArray(data?.choices)) {
      return {
        ok: false,
        status: res.status,
        latencyMs,
        error: "Response missing choices[]",
      };
    }

    return {
      ok: true,
      status: res.status,
      latencyMs,
      preview: typeof preview === "string" ? preview.slice(0, 120) : "",
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
