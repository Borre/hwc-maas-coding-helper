# maas-coding-helper

CLI tool to use Huawei Cloud ModelArts MaaS as an OpenAI-compatible backend for coding tools.

After running `npx maas-coding-helper init`, MaaS works as a drop-in OpenAI backend everywhere:

```python
# Python — just works
from openai import OpenAI
client = OpenAI()
```

```js
// Node.js — just works
import OpenAI from "openai";
const client = new OpenAI();
```

OpenCode and Claude Code use `glm-5.1` via MaaS automatically.

---

## Start Here (Beginner Friendly)

If your main goal is to quickly connect MaaS to coding assistants, use one of these paths:

### Claude Code (Recommended)

```bash
# 1) Initialize MaaS in your current project
npx maas-coding-helper init

# 2) Verify connectivity
npx maas-coding-helper test

# 3) Confirm active config
npx maas-coding-helper status
```

Expected result:
- `.claude.json` is created/updated for OpenAI-compatible MaaS usage
- `status` shows API key (masked), region, mode, model, and endpoint URLs

### OpenCode

```bash
# 1) Initialize MaaS in your current project
npx maas-coding-helper init

# 2) Verify connectivity
npx maas-coding-helper test

# 3) Confirm active config
npx maas-coding-helper status
```

Expected result:
- `opencode.json` is created/updated for MaaS
- `status` confirms your active model and endpoint configuration

---

## Install

```bash
# Run directly (no install needed)
npx maas-coding-helper init

# Or install globally
npm install -g maas-coding-helper
maas-coding-helper init
```

---

## Commands

### `init`

Detect your project environment, configure MaaS, and write all necessary config.

```bash
maas-coding-helper init
```

Options:
| Flag | Description |
|---|---|
| `--api-key <key>` | MaaS API key (skips prompt) |
| `--region <region>` | Region, e.g. `ap-southeast-1` |
| `--mode <mode>` | `openai-compatible` (default) or `native` |
| `--verbose` | Enable debug logging |

What `init` does:
1. **Detects** your project type (Python / Node / unknown)
2. **Detects** existing tool configs (OpenCode, Claude Code, OpenAI SDK)
3. **Prompts** for API key, region, endpoint mode, default model
4. **Writes** `.env` with `OPENAI_API_KEY` + `OPENAI_BASE_URL` (and `MAAS_*` vars)
5. **Writes** `~/.maas/config.json` as global fallback
6. **Configures** OpenCode / Claude Code if detected
7. **Warns** if OpenAI SDK usage is missing `base_url` / `baseURL`
8. **Prints** usage examples for your stack

### `test`

Validate MaaS connectivity and authentication.

```bash
maas-coding-helper test
maas-coding-helper test --native   # also test native v2 endpoint
```

Sends a `ping` to `glm-5.1` and reports:
- Auth success/failure
- Response preview
- Latency

### `use <model>`

Switch the default model profile.

```bash
maas-coding-helper use glm-5.1
maas-coding-helper use deepseek-r1-250528
maas-coding-helper use qwen3-32b
```

Updates `.env` and process environment.

### `models`

List all available models.

```bash
maas-coding-helper models
```

### `regions`

List all available regions.

```bash
maas-coding-helper regions
```

### `status`

Show current configuration.

```bash
maas-coding-helper status
```

---

## Endpoint Modes

### OpenAI-Compatible (default)

```
https://api-{region}.modelarts-maas.com/openai/v1
```

Sets `OPENAI_API_KEY` and `OPENAI_BASE_URL` so any OpenAI-compatible tool works without code changes.

### Native v2

```
https://api-{region}.modelarts-maas.com/v2/chat/completions
```

Sets `MAAS_API_KEY` and `MAAS_BASE_URL`. Use when you need the raw MaaS API.

---

## Supported Models

| Alias | Model ID | Provider |
|---|---|---|
| `deepseek-v3.2` | `deepseek-v3.2` | DeepSeek |
| `deepseek-v3.1-terminus` | `deepseek-v3.1-terminus` | DeepSeek |
| `qwen3-32b` | `qwen3-32b` | Qwen |
| `DeepSeek-V3` | `DeepSeek-V3` | DeepSeek |
| `glm-5` | `glm-5` | Zhipu |
| `glm-5.1` | `glm-5.1` | Zhipu |
| `deepseek-r1-250528` | `deepseek-r1-250528` | DeepSeek |

---

## Supported Regions

| Region ID | Location |
|---|---|
| `ap-southeast-1` | Asia Pacific (Singapore) |

---

## Integration Examples

### Python (OpenAI SDK)

```python
from openai import OpenAI

# Auto-detects OPENAI_API_KEY + OPENAI_BASE_URL from .env
client = OpenAI()

response = client.chat.completions.create(
    model="glm-5.1",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

### Node.js (OpenAI SDK)

```js
import OpenAI from "openai";

// Auto-detects OPENAI_API_KEY + OPENAI_BASE_URL from env
const client = new OpenAI();

const response = await client.chat.completions.create({
  model: "glm-5.1",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);
```

### OpenCode

After `init`, OpenCode automatically uses MaaS. The config is written to `opencode.json`:

```json
{
  "provider": "openai",
  "model": "glm-5.1",
  "baseURL": "https://api-ap-southeast-1.modelarts-maas.com/openai/v1",
  "apiKey": "<your-key>"
}
```

### Claude Code

After `init`, Claude Code config is written to `.claude.json`:

```json
{
  "apiProvider": "openai-compatible",
  "apiBaseUrl": "https://api-ap-southeast-1.modelarts-maas.com/openai/v1",
  "apiKey": "<your-key>",
  "model": "glm-5.1"
}
```

Or export environment variables:

```bash
export OPENAI_API_KEY="<your-key>"
export OPENAI_BASE_URL="https://api-ap-southeast-1.modelarts-maas.com/openai/v1"
export CLAUDE_CODE_USE_OPENAI=1
```

### Any OpenAI-Compatible Tool

```bash
export OPENAI_API_KEY="<your-maas-key>"
export OPENAI_BASE_URL="https://api-ap-southeast-1.modelarts-maas.com/openai/v1"
```

Then use any tool that speaks the OpenAI protocol — curl, LiteLLM, LangChain, etc.

---

## Troubleshooting (Plain Language)

### `status` says “No API key configured”

Run setup again:

```bash
maas-coding-helper init
```

Then verify:

```bash
maas-coding-helper status
```

### `test` fails with auth errors

- Re-run `init` and paste your MaaS API key carefully
- Confirm region and endpoint mode are correct for your account
- Retry:

```bash
maas-coding-helper test
maas-coding-helper test --native
```

### Claude Code/OpenCode still not using MaaS

1. Run:
   ```bash
   maas-coding-helper status
   ```
2. Confirm mode is `openai-compatible`
3. Re-run:
   ```bash
   maas-coding-helper init
   ```
4. Restart your editor/terminal session

### Safety tip before first run

If you already have custom Claude/OpenCode config files, back them up before running `init`:

```bash
cp .claude.json .claude.json.bak 2>/dev/null || true
cp opencode.json opencode.json.bak 2>/dev/null || true
```

This gives you a fast rollback path if you need to restore previous settings.

---

## Environment Variables

| Variable | Set By | Description |
|---|---|---|
| `OPENAI_API_KEY` | `init` (openai-compatible mode) | MaaS API key, exposed as OpenAI key |
| `OPENAI_BASE_URL` | `init` (openai-compatible mode) | MaaS OpenAI-compatible endpoint |
| `MAAS_API_KEY` | `init` (both modes) | MaaS API key |
| `MAAS_BASE_URL` | `init` (native mode) | MaaS native v2 endpoint |
| `MAAS_REGION` | `init` | Region, e.g. `ap-southeast-1` |
| `MAAS_ENDPOINT_MODE` | `init` | `openai-compatible` or `native` |
| `MAAS_DEFAULT_MODEL` | `init`, `use` | Default model ID |

---

## Security

- API keys are **masked in all logs** (`abcd****wxyz`)
- Full secrets are **never printed** to stdout
- Config is written to `.env` (project) and `~/.maas/config.json` (global)
- `.env` is in `.gitignore` by default

---

## Project Structure

```
src/
├── index.ts                  # CLI entrypoint
├── cli/
│   ├── init.ts               # Interactive setup
│   ├── test.ts               # Connectivity validation
│   └── use.ts                # Model switching
├── providers/
│   └── maas.ts               # MaaS API client
├── integrations/
│   ├── opencode.ts           # OpenCode config injection
│   ├── claude.ts             # Claude Code config injection
│   ├── python.ts             # Python SDK patching + snippets
│   └── node.ts               # Node SDK patching + snippets
├── utils/
│   ├── logger.ts             # Masked, leveled logging
│   ├── env.ts                # .env + global config read/write
│   ├── detect.ts             # Project type + tool detection
│   └── fs.ts                 # File helpers
└── config/
    └── schema.ts             # Regions, models, endpoints, types
```

---

## Quick Start

```bash
# 1. Initialize
npx maas-coding-helper init

# 2. Validate
npx maas-coding-helper test

# 3. Switch models anytime
npx maas-coding-helper use deepseek-r1-250528

# 4. Check status
npx maas-coding-helper status
```

---

## License

MIT
