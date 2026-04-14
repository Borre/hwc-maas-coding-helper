# Production Readiness Audit (2026-04-14)

## Scope
- TypeScript CLI code in `src/`.
- Build validation via `npm run build`.

## Executive summary
This project is a good prototype, but it is **not production-ready** yet. Main risks are around config file corruption, weak input validation, and lack of automated test coverage.

## Findings

### 1) High: Possible destructive overwrite of existing OpenCode/Claude config
- `configureOpenCode()` and `configureClaude()` read existing config, swallow parse errors, then continue with `{}` and overwrite file contents.
- If the existing file format is not the expected JSON/YAML shape (or contains comments/extra syntax), this can silently destroy user config.
- Code locations:
  - `src/integrations/opencode.ts`
  - `src/integrations/claude.ts`
- Recommendation:
  - Fail fast when parsing fails.
  - Back up existing config before write.
  - Use format-aware parsing for `.opencode` and Claude config variants.

### 2) High: No validation for CLI-supplied `--region` and `--mode`
- `runInit()` accepts `options.region` and `options.mode` directly and may generate invalid endpoints.
- This can produce broken `.env` and hard-to-debug runtime failures.
- Code location: `src/cli/init.ts`.
- Recommendation:
  - Validate against `REGIONS` keys and `EndpointMode` enum.
  - Reject unknown values with explicit error messages.

### 3) Medium: Native endpoint assumptions are hard-coded and unverified
- Native requests are sent to `${base}/v2/chat/completions` with OpenAI-style payload keys.
- If provider native API diverges (headers/body/paths), requests will fail at runtime.
- Code location: `src/config/schema.ts`, `src/providers/maas.ts`.
- Recommendation:
  - Add provider-contract tests and feature flags for native payload mapping.
  - Document native compatibility assumptions.

### 4) Medium: Weak observability and no structured error taxonomy
- API errors are mostly stringified and propagated as plain text.
- No stable error codes for auth, quota, model-not-found, or region mismatch.
- Code location: `src/providers/maas.ts`, `src/cli/test.ts`.
- Recommendation:
  - Normalize error classes/codes and emit actionable guidance per class.

### 5) Medium: No automated test suite or CI quality gates
- `package.json` has no test/lint/typecheck scripts besides build.
- This increases regression risk just before production.
- Recommendation:
  - Add unit tests for config/env parsing, endpoint resolution, and integration patch behavior.
  - Add linting + CI workflow with required checks.

### 6) Low: Global singleton logger can be unexpectedly reconfigured
- `getLogger(verbose?)` mutates singleton when called with any explicit `verbose` value.
- Different code paths can unintentionally change logging behavior.
- Code location: `src/utils/logger.ts`.
- Recommendation:
  - Avoid mutable singleton; pass logger instance explicitly.

## Suggested pre-production checklist (tomorrow)
1. Add strict input validation for region/mode.
2. Make config writes transactional: parse+validate, backup, then write.
3. Add smoke tests for both OpenAI-compatible and native flow.
4. Add one end-to-end CLI test (`init -> test -> use`).
5. Introduce CI pipeline requiring `npm run build` + test suite.
