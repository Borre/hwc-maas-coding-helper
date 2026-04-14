import test from "node:test";
import assert from "node:assert/strict";

import { envSetCommands } from "../utils/shell.js";
import { testOpenAICompatible } from "../providers/maas.js";

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
