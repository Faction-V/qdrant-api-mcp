# Qdrant MCP Server Improvement Notes

This MCP server provides read-only access to Qdrant Cloud clusters (`list_collections`, `get_collection`, `search_points`, `count_points`). For the next Codex coding session, consider the following enhancements:

## 1. Implement MCP resource discovery
- Currently `resources/list` and `resources/templates/list` return `-32601 Method not found`.
- Add stub handlers so discovery tools can verify connectivity before invoking the custom tools.
- Populate `resources/list` with useful references, e.g., an overview of currently configured clusters and their capabilities.

## 2. Surface multiple cluster profiles
- We often swap between production, metric-media, and test clusters. Instead of launching separate processes, support a `cluster` argument in the MCP server that selects the endpoint/API key at runtime.
- Optionally add a lightweight `switch_cluster` tool that returns the currently active cluster and allows Codex to change it without restarting the server.

## 3. Tool ergonomics
- Add a `describe_point` tool that fetches a point by ID and renders payload, vectors, and shard info in a single call.
- Provide pagination helpers for `scroll_points` so long-running scrolls can resume where the previous one left off.

## 4. Operational safeguards
- Implement request throttling or rate limits to prevent accidental production outages when large hybrid queries are issued through MCP.
- Emit structured logs (JSON) so we can correlate Codex-issued MCP calls with Qdrant audit events.

## 5. Documentation & examples
- Expand `README.md` with quickstart instructions for running the server, sample MCP tool invocations, and best practices for connecting to prod clusters safely.

> Reminder: this environment’s `approval_policy = "never"`, so any destructive tool (collection creation/deletion) must remain disabled unless explicitly authorized.
