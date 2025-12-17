# MCP HTTP Refactor Plan

## Goal
Refactor the Fastify HTTP MCP endpoint so it uses the official MCP SDK (server + Streamable HTTP transport) instead of a custom JSON-RPC handler. This aligns the HTTP deployment with the existing stdio-based server and ensures protocol-compliant behavior (initialize handshake, SSE, session lifecycle, etc.).

---

## 1. Extract Shared MCP Runtime

1. **Create `src/mcp/runtime.ts`** that exports:
   - `createQdrantRuntime(options?: { logger?: PinoLogger })` → returns `{ server, clusterManager, rateLimiter, logger }`.
   - shared constants (`serverInfo`, `serverCapabilities`) if helpful.
2. Move all tool/resource handler code from `src/mcp-server.ts` into this module. Keep helper functions (`runClusterTool`, pagination helpers, etc.) intact.
3. Update the stdio entrypoint to:
   - `import { createQdrantRuntime } from './mcp/runtime.js';`
   - Instantiate the runtime, create a `StdioServerTransport`, and connect the server.
   - Log the same boot info using the runtime’s logger.

This eliminates global singletons and lets HTTP/stdio share the exact same MCP logic.

---

## 2. Rebuild Fastify HTTP Endpoint Using MCP Transport

1. **Import** `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`.
2. In `src/index.ts`:
   - Instantiate the runtime once (`createQdrantRuntime({ logger: server.log })`).
   - Maintain a `Map<string, StreamableHTTPServerTransport>` (if resumability needed) keyed by MCP session ID.
3. **POST /mcp** (and slug variants):
   - For initialize requests (no session header + JSON payload is `initialize`), create a new transport with a `sessionIdGenerator` and `onsessioninitialized` hook to store it in the map. Connect the runtime server to that transport before calling `handleRequest`.
   - For subsequent requests, fetch the transport by session ID and call `handleRequest`.
   - Return appropriate 400/404 errors if the session header is invalid.
4. **GET /mcp**: delegate to `transport.handleRequest` to support SSE streams (requires `Accept: text/event-stream`). Validate session header first.
5. **DELETE /mcp**: delegate to `transport.handleRequest` to terminate sessions per the spec.
6. **Slugged routes**: mount the same handlers on both `/mcp` and `/:serverSlug/mcp`. Do the same for `/health`.
7. **Error handling**: ensure Fastify replies are hijacked or ended by the transport (since it writes to `reply.raw`). Keep logging consistent.

---

## 3. Clean Up Old HTTP Class (if present)
If `src/mcp/server.ts` is still referenced elsewhere, turn it into a thin wrapper around the new transport-based handler. Remove the manual JSON-RPC switch entirely.

---

## 4. Docs & Tests
- Update README to mention the Streamable HTTP transport (supports SSE/DELETE, session IDs) and note that `/mcp`/`/:slug/mcp` are served by the SDK.
- Add/adjust tests: ideally a smoke test ensuring `createQdrantRuntime` returns a server that handles `initialize` via `StreamableHTTPServerTransport`.
- Verify `npm run build` still targets the right files.

---

## 5. Release Steps
1. `npm run build`
2. `npm test`
3. `just release <version>` / `npm publish`
4. Redeploy and validate both stdio and HTTP clients (Inspector, mcp-runner, Postman) can connect without errors.

This plan ensures the HTTP endpoint behaves exactly like the stdio server (shared tools/capabilities), while fully leveraging the MCP SDK’s transport and session handling.
