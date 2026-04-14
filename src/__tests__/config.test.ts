import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";

import { readProjectEnv, writeProjectEnv } from "../utils/env.js";

test("writeProjectEnv merges with existing keys and can round-trip", () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "maas-config-"));

  try {
    writeProjectEnv({ OPENAI_API_KEY: "a", MAAS_REGION: "ap-southeast-1" }, cwd);
    writeProjectEnv({ MAAS_MODEL: "glm-5.1" }, cwd);

    const loaded = readProjectEnv(cwd);
    assert.equal(loaded.OPENAI_API_KEY, "a");
    assert.equal(loaded.MAAS_REGION, "ap-southeast-1");
    assert.equal(loaded.MAAS_MODEL, "glm-5.1");

    const envRaw = readFileSync(path.join(cwd, ".env"), "utf8");
    assert.match(envRaw, /OPENAI_API_KEY=a/);
    assert.match(envRaw, /MAAS_MODEL=glm-5\.1/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
