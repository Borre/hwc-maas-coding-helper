export enum MaaSErrorCode {
  AUTH_FAILED = "AUTH_FAILED",
  REGION_NOT_FOUND = "REGION_NOT_FOUND",
  MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  UNKNOWN = "UNKNOWN",
}

export class MaaSError extends Error {
  constructor(
    public readonly code: MaaSErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "MaaSError";
  }
}

export interface MaaSTestResult {
  ok: boolean;
  status?: number;
  latencyMs: number;
  preview?: string;
  error?: string;
  code?: MaaSErrorCode;
}

async function handleResponse(res: Response, started: Date): Promise<MaaSTestResult> {
  const latencyMs = Date.now() - started.getTime();
  let data: any;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      status: res.status,
      latencyMs,
      code: MaaSErrorCode.INVALID_RESPONSE,
      error: `Failed to parse response (HTTP ${res.status})`,
    };
  }

  if (!res.ok) {
    let code = MaaSErrorCode.API_ERROR;
    if (res.status === 401 || res.status === 403) code = MaaSErrorCode.AUTH_FAILED;
    if (res.status === 404) code = MaaSErrorCode.MODEL_NOT_FOUND;

    return {
      ok: false,
      status: res.status,
      latencyMs,
      code,
      error: data?.error?.message || `HTTP ${res.status}`,
    };
  }

  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
  if (content === undefined) {
    return {
      ok: false,
      status: res.status,
      latencyMs,
      code: MaaSErrorCode.INVALID_RESPONSE,
      error: "Response missing choices[].message.content or choices[].text",
    };
  }

  return {
    ok: true,
    status: res.status,
    latencyMs,
    preview: typeof content === "string" ? content.slice(0, 120) : "",
  };
}

export async function testOpenAICompatible(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
}): Promise<MaaSTestResult> {
  const started = new Date();
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
    return handleResponse(res, started);
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started.getTime(),
      code: MaaSErrorCode.NETWORK_ERROR,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function testNative(input: {
  apiKey: string;
  endpoint: string;
  model: string;
}): Promise<MaaSTestResult> {
  const started = new Date();
  try {
    const res = await fetch(input.endpoint, {
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
    return handleResponse(res, started);
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started.getTime(),
      code: MaaSErrorCode.NETWORK_ERROR,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
