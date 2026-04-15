# Contributing to hwc-maas-coding-helper

Welcome! This CLI is designed to help developers use Huawei Cloud ModelArts MaaS with their favorite coding tools. Here’s how you can help.

## Development Environment Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/hwc-maas-coding-helper.git
    cd hwc-maas-coding-helper
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the project**:
    ```bash
    npm run build
    ```

4.  **Run tests**:
    ```bash
    npm test
    ```

## Adding New Models or Regions

To add support for a new model or region, modify `src/config/schema.ts`:

-   **New Model**: Add an entry to the `MODELS` record. Use the official model identifier from Huawei Cloud MaaS.
-   **New Region**: Add an entry to the `REGIONS` record with its internal ID and a human-readable name.

## Code Style & Standards

-   Use **TypeScript** for all logic.
-   Ensure **all new features have tests** in `src/__tests__`.
-   Use **atomic file writes** via `src/utils/fs.ts` for any configuration changes.
-   Maintain **structured error handling** in `src/providers/maas.ts`.

## Deployment

This package is published via `npm`. Ensure you increment the version in `package.json` and update the `README.md` with any new command flags.

## Testing Against Real API

For integration testing with a real API key, you can create a local `.env` file:
```bash
MAAS_API_KEY=your_key_here
MAAS_REGION=ap-southeast-1
MAAS_MODEL=glm-5.1
```
Then run the local build:
```bash
node dist/cli.js test
```
