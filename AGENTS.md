# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` boots the Fastify HTTP service and wires health checks and the MCP entrypoint.
- `src/mcp/` houses the Model Context Protocol server, tool registration, and request handling.
- `src/lib/` and `src/generated/` contain the Qdrant client helpers and the OpenAPI generated SDK; regenerate clients with `npm run generate-client` when schemas change.
- Type definitions live under `src/types/`; environment contracts and defaults are defined in `src/config/`.
- Build output is written to `dist/`; keep generated assets out of version control.

## Build, Test, and Development Commands
- `npm install` — install all runtime and development dependencies.
- `npm run dev` — launch the Fastify app with `ts-node` and live reload for local API exploration.
- `npm run dev:mcp` — run only the MCP server entrypoint for quick tool iteration.
- `npm run build` — compile TypeScript to `dist/`; run before publishing or deploying.
- `npm start` / `npm run start:mcp` — execute the compiled services in production mode.
- `npm run generate-client` — rebuild the Qdrant client from the bundled OpenAPI specs.

## Coding Style & Naming Conventions
- Use TypeScript with ES2020 modules, 2-space indentation, and trailing commas on multiline literals.
- Favor `camelCase` for variables/functions, `PascalCase` for classes/types, and descriptive filenames (e.g., `mcp-server.ts`).
- Prefer explicit exports and keep functions small; colocate helpers near their callers within the same module.
- Log with the existing Pino instance instead of `console.*` to preserve formatting.

## Testing Guidelines
- Tests are not yet scaffolded; introduce them under `src/__tests__/` or `tests/` using a Node-friendly runner such as Vitest or Jest.
- Mirror the Fastify/MCP integration through integration tests that spin up the server against a local Qdrant instance.
- Add regression cases whenever touching generated clients or request handlers; document new scripts under `package.json`.

## Commit & Pull Request Guidelines
- Existing commits are concise, imperative summaries (e.g., `collections api done`, `[wip] adding points tools`). Continue that style or adopt Conventional Commit prefixes if it adds clarity.
- Reference related issues in the description, list validation steps (build/tests), and attach screenshots or logs when adjusting API behavior.
- Keep PRs focused; call out schema changes and regenerated artifacts explicitly.

## Security & Configuration Tips
- Never commit `.env` files; rely on `dotenv` locally and environment variables in production.
- Sanitize Qdrant API keys before logging; the default config pulls from `process.env` in `src/config/env.ts`.
- When testing against remote clusters, throttle point mutations and avoid storing sensitive payload data in example fixtures.
