import test from "node:test";
import assert from "node:assert/strict";

import { envSetCommands } from "../utils/shell.js";
import { testOpenAICompatible, testNative, MaaSErrorCode } from "../providers/maas.js";

test("shell command generation includes bash/zsh/powershell/cmd variants", () => {
  const commands = envSetCommands("OPENAI_API_KEY", "abc123");
  assert.equal(commands.bash, "export OPENAI_API_KEY='abc123'");
  assert.equal(commands.zsh, "export OPENAI_API_KEY='abc123'");
  assert.equal(commands.powershell, "$env:OPENAI_API_KEY='abc123'");
  assert.equal(commands.cmd, "set OPENAI_API_KEY=\"abc123\"");
});

test("maas provider works against mocked OpenAI-compatible fetch", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => new Response(JSON.stringify({
    choices: [{ message: { content: "pong" } }],
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })) as typeof fetch;

  try {
    const result = await testOpenAICompatible({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1:18080/openai/v1",
      model: "glm-5.1",
    });

    assert.equal(result.ok, true);
    assert.equal(typeof result.latencyMs, "number");
    assert.equal(result.preview, "pong");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maas provider handles auth failure", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => new Response(JSON.stringify({
    error: { message: "Unauthorized" },
  }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  })) as typeof fetch;

  try {
    const result = await testOpenAICompatible({
      apiKey: "wrong-key",
      baseUrl: "http://127.0.0.1:18080/openai/v1",
      model: "glm-5.1",
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, MaaSErrorCode.AUTH_FAILED);
    assert.equal(result.error, "Unauthorized");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maas provider handles native endpoint", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (url) => {
    assert.ok(String(url).endsWith("/v2/chat/completions"));
    return new Response(JSON.stringify({
      choices: [{ text: "native pong" }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const result = await testNative({
      apiKey: "test-key",
      endpoint: "http://127.0.0.1:18080/v2/chat/completions",
      model: "glm-5.1",
    });

    assert.equal(result.ok, true);
    assert.equal(result.preview, "native pong");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maas provider handles invalid JSON response", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => new Response("Internal Server Error", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  })) as typeof fetch;

  try {
    const result = await testOpenAICompatible({
      apiKey: "test-key",
      baseUrl: "http://127.0.0.1:18080/openai/v1",
      model: "glm-5.1",
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, MaaSErrorCode.INVALID_RESPONSE);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
