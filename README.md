# maas-coding-helper

Production-ready CLI to configure Huawei Cloud ModelArts MaaS (`glm-5.1`) as a drop-in OpenAI-compatible backend.

## Prerequisites

Before using this CLI, ensure you have:
1.  **Huawei Cloud Account**: [Sign up here](https://www.huaweicloud.com/).
2.  **MaaS API Key**: Obtain your API key from the [ModelArts MaaS console](https://console.huaweicloud.com/maas/).
3.  **Node.js**: Version 18 or higher.

## Install / Run

You can run the CLI directly using `npx`:

```bash
npx maas-coding-helper init
```

Or install it globally:

```bash
npm install -g hwc-maas-coding-helper
maas-coding-helper init
```

## Cross-platform environment variable examples

```bash
# Linux/macOS (bash/zsh)
export OPENAI_API_KEY='your_api_key'

# Windows PowerShell
$env:OPENAI_API_KEY='your_api_key'

# Windows CMD
set OPENAI_API_KEY="your_api_key"
```

## What it configures

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL=https://api-ap-southeast-1.modelarts-maas.com/openai/v1`

Priority order used by the CLI:
1. CLI flags
2. Project config (`.env`)
3. Global config (`~/.maas/config.json`)
4. Process environment (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `MAAS_API_KEY`)

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
Validates auth, response shape, latency, and preview. Supports both OpenAI-compatible and native endpoints.

```bash
npx maas-coding-helper test
npx maas-coding-helper test --model glm-5.1 --region ap-southeast-1
npx maas-coding-helper test --native
npx maas-coding-helper test --base-url http://127.0.0.1:18080/openai/v1
```

Flags:
- `--model <model>`
- `--region <region>`
- `--base-url <url>` (OpenAI-compatible only)
- `--native` (Test native endpoint instead of OpenAI-compatible)

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

## Troubleshooting

### Connectivity Issues
If the `test` command fails:
1.  **Check API Key**: Ensure your API key is active.
2.  **Verify Region**: Make sure the model you are using is available in the selected region.
3.  **Network Check**: Run `maas-coding-helper test --native` to see if the underlying Huawei Cloud endpoint is reachable.
4.  **Doctor Command**: Run `maas-coding-helper doctor` to detect configuration conflicts.

### Integration Failures
- **OpenCode**: If your `opencode.json` is not updated, ensure you are running the command in the project root.
- **Claude Code**: Check if `.claude.json` exists; the CLI will only update it if it's already present.

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
    shell.ts
    detect.ts
    fs.ts
    logger.ts
  __tests__/
  types.ts
```
