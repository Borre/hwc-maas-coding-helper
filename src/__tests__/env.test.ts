import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";

import {
  globalConfigPath,
  parseEnv,
  projectEnvPath,
  resolveEffectiveConfig,
  stringifyEnv,
} from "../utils/env.js";

test("parseEnv handles CRLF and export prefix", () => {
  const parsed = parseEnv("export OPENAI_API_KEY='abc123'\r\nMAAS_REGION=ap-southeast-1\r\n");
  assert.equal(parsed.OPENAI_API_KEY, "abc123");
  assert.equal(parsed.MAAS_REGION, "ap-southeast-1");
});

test("stringifyEnv emits deterministic LF output", () => {
  const output = stringifyEnv({ B: "2", A: "1" });
  assert.equal(output, "A=1\nB=2\n");
});

test("projectEnvPath and globalConfigPath are absolute and OS-safe", () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "maas-path-"));
  try {
    assert.equal(projectEnvPath(cwd), path.resolve(cwd, ".env"));
    assert.equal(globalConfigPath(), path.resolve(os.homedir(), ".maas", "config.json"));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("resolveEffectiveConfig accepts OPENAI_BASE_URL from environment", () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousBase = process.env.OPENAI_BASE_URL;

  process.env.OPENAI_API_KEY = "env-key";
  process.env.OPENAI_BASE_URL = "http://127.0.0.1:18080/openai/v1";

  try {
    const resolved = resolveEffectiveConfig({});
    assert.equal(resolved.apiKey, "env-key");
    assert.equal(resolved.baseUrl, "http://127.0.0.1:18080/openai/v1");
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;

    if (previousBase === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previousBase;
  }
});
