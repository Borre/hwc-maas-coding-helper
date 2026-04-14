# maas-coding-helper

Production-ready CLI to configure Huawei Cloud ModelArts MaaS (`glm-5.1`) as a drop-in OpenAI-compatible backend.

## Install / Run

```bash
npx maas-coding-helper init
```

## What it configures

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL=https://api-ap-southeast-1.modelarts-maas.com/openai/v1`

Priority order used by the CLI:
1. CLI flags
2. Project config (`.env`)
3. Global config (`~/.maas/config.json`)

## Commands

### `init`
Interactive setup (API key, region, model, scope, tool), then runs connectivity test.

```bash
npx maas-coding-helper init
npx maas-coding-helper init --dry-run --verbose
```

### `configure`
Non-interactive setup.

```bash
npx maas-coding-helper configure --tool generic --project --api-key "$MAAS_API_KEY"
npx maas-coding-helper configure --tool opencode --project --model glm-5.1 --region ap-southeast-1
npx maas-coding-helper configure --tool claude --global
```

Flags:
- `--tool [opencode|claude|generic]` (required)
- `--model <model>`
- `--region <region>`
- `--api-key <key>`
- `--project`
- `--global`
- `--dry-run`
- `--verbose`
- `--json`

### `test`
Validates auth, response shape, latency, and preview.

```bash
npx maas-coding-helper test
npx maas-coding-helper test --model glm-5.1 --region ap-southeast-1
```

### `doctor`
Detects missing env vars, conflicts, and partial setup with actionable fixes.

```bash
npx maas-coding-helper doctor
```

## Integrations

### OpenCode
- Best-effort safe update of `opencode.json` if present and parseable.
- Otherwise falls back to environment variables only.

### Claude Code
- Best-effort safe update of `.claude.json` if present and parseable.
- Otherwise falls back to environment variables only.

### Python (OpenAI SDK)

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
)
```

### Node (OpenAI SDK)

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
```

## Security

- API key is masked in logs.
- API key is never printed in full.
- Supports project `.env` and global `~/.maas/config.json` storage.

## Project structure

```text
src/
  cli.ts
  commands/
    init.ts
    configure.ts
    test.ts
    doctor.ts
  providers/
    maas.ts
  integrations/
    opencode.ts
    claude.ts
    python.ts
    node.ts
  utils/
    env.ts
    detect.ts
    fs.ts
    logger.ts
  types.ts
```
