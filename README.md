# Qdrant MCP Server

A Model Context Protocol (MCP) server that wraps the Qdrant Collections and Points API.
MCP tools are built straight from the official qdrant openapi schema files here: https://github.com/qdrant/qdrant/tree/master/openapi

## Configure with Windsurf/Cursor
To use this tool with Windsurf or Cursor, add the following to your configuration:

```json
{
  "mcpServers": {
    "qdrant-api": {
      "command": "node",
      "args": [
        "/Users/admin/dev/cap/qdrant-api-mcp/dist/mcp-server.js"
      ],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "QDRANT_API_KEY": "my-secret-key-or-blank"
      }
    }
  }
}
```

## Features

- Implements the MCP JSON-RPC specification with structured JSON logs (Pino).
- Resource discovery (`resources/list`, `resources/read`, `resources/templates/list`) advertises every configured cluster profile so MCP-aware tooling can “ping” the server before invoking tools.
- Multi-cluster operation via optional `QDRANT_CLUSTER_PROFILES` and a `switch_cluster` tool. Change clusters without restarting the process.
- Built-in request throttling (configurable via `MCP_RATE_LIMIT_MAX_REQUESTS`/`MCP_RATE_LIMIT_WINDOW_MS`) to prevent runaway hybrid queries.
- Tools cover the full Collections/Points API plus new ergonomics:
  - `describe_point`: combines payload, vector, and shard/cluster insights for a single point.
  - `scroll_points_paginated`: emits resumable cursors for large scroll jobs.
  - `switch_cluster`: inspects or updates the active cluster.
- All existing collection & point tools remain available: `list_collections`, `create_collection`, `get_collection`, `delete_collection`, `update_collection`, `upsert_points`, `search_points`, `scroll_points`, `count_points`, `recommend_points`, `get_point`, `delete_point`, `delete_points`, `set_payload`, `overwrite_payload`, `delete_payload`, `clear_payload`.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Qdrant server (local or remote)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env`:

```
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_api_key_if_needed
PORT=3000
HOST=localhost
```

## Quickstart

1. Install dependencies and compile once:
   ```bash
   npm install
   npm run build
   ```
2. Point your MCP-compatible IDE/agent at the compiled entrypoint (`dist/mcp-server.js`). A sample config lives in `qdrant-mcp-config.json`.
3. (Optional) Define multiple clusters in your environment:
   ```bash
   export QDRANT_CLUSTER_PROFILES='[
     {"name":"prod","url":"https://prod.example","apiKey":"***","description":"Production search"},
     {"name":"metric-media","url":"https://metric-media.example","apiKey":"***","labels":["metrics","readonly"]},
     {"name":"test","url":"http://localhost:6333"}
   ]'
   export QDRANT_DEFAULT_CLUSTER=prod
   ```
4. Launch the MCP server (dev hot reload shown):
   ```bash
   npm run dev:mcp
   ```
5. From your MCP client, call `switch_cluster` (with no args) to verify the active cluster, or provide `{"cluster":"test"}` to pivot to a different backend without restarting.

## Usage

### Development

Run the server in development mode:

```bash
npm run dev
```

### Production

Build and run the server:

```bash
npm run build
npm start
```

## Operational safeguards & logging

- **Rate limiting:** `MCP_RATE_LIMIT_MAX_REQUESTS` (default `10`) and `MCP_RATE_LIMIT_WINDOW_MS` (default `1000`) bound the number of tool calls per cluster/tool combination. Tune these per environment to protect production clusters from runaway agents.
- **Structured logs:** Set `LOG_LEVEL=debug` (or `info`, `warn`, etc.). Each MCP tool call is logged with `{event, tool, cluster, durationMs}` so Qdrant audit events can be correlated easily.
- **Resource discovery:** `resources/list` advertises every configured cluster as `qdrant://clusters/<name>`. Reading the resource returns a JSON overview (active flag, collection preview, rate limits, safety hints).

## Sample MCP tool calls

Switch clusters without restarting the process:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "switch_cluster",
    "arguments": { "cluster": "metric-media" }
  }
}
```

Resume a long scroll using the new pagination helper:

```json
{
  "jsonrpc": "2.0",
  "id": 99,
  "method": "tools/call",
  "params": {
    "name": "scroll_points_paginated",
    "arguments": {
      "collection_name": "hybrid-docs",
      "limit": 128,
      "with_payload": true
    }
  }
}
```

The response includes `cursor`; feed it back into the next call to continue from the previous `next_page_offset`.

Deep dive into a single point (payload + vector + shard metadata):

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "describe_point",
    "arguments": {
      "cluster": "prod",
      "collection_name": "docs",
      "point_id": "doc-123"
    }
  }
}
```

## Best practices for production clusters

- Keep destructive tools (collection/point mutation) disabled unless you have explicit approval for the target environment. The sample config only whitelists read-only tools by default.
- Use `switch_cluster` to make sure you are operating on the intended cluster before issuing search/scroll commands.
- Lower `MCP_RATE_LIMIT_MAX_REQUESTS` for clusters that back user-facing workloads.
- Scrub or truncate payload data before pasting MCP responses into bug reports—cluster resources can include sensitive labels.
- Rotate API keys regularly and store them only in environment variables; the MCP resource summaries intentionally omit raw credentials.

## API Endpoints

### MCP JSON-RPC Endpoint

- `POST /mcp`: The main MCP JSON-RPC endpoint

Example request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "list_collections",
  "params": {}
}
```

Example response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "collections": ["collection1", "collection2"]
  }
}
```

### Health Check

- `GET /health`: Returns server health status

## Available Methods

### list_collections

Lists all collections.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "list_collections",
  "params": {}
}
```

### create_collection

Creates a new collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "create_collection",
  "params": {
    "collection_name": "my_collection",
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    }
  }
}
```

### get_collection

Gets detailed information about a collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_collection",
  "params": {
    "collection_name": "my_collection"
  }
}
```

### delete_collection

Deletes a collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "delete_collection",
  "params": {
    "collection_name": "my_collection"
  }
}
```

### update_collection

Updates collection parameters.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "update_collection",
  "params": {
    "collection_name": "my_collection",
    "optimizers_config": {
      "deleted_threshold": 0.2,
      "vacuum_min_vector_number": 1000
    }
  }
}
```

## Points Operations

### upsert_points

Insert or update points in a collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "upsert_points",
  "params": {
    "collection_name": "my_collection",
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, 0.3, 0.4],
        "payload": {
          "category": "example",
          "value": 42
        }
      }
    ]
  }
}
```

### search_points

Search for similar points in a collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "search_points",
  "params": {
    "collection_name": "my_collection",
    "vector": [0.1, 0.2, 0.3, 0.4],
    "limit": 10,
    "with_payload": true,
    "with_vector": false
  }
}
```

### scroll_points

Scroll through points in a collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "scroll_points",
  "params": {
    "collection_name": "my_collection",
    "limit": 10,
    "with_payload": true
  }
}
```

### count_points

Count points in a collection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "count_points",
  "params": {
    "collection_name": "my_collection",
    "filter": {
      "must": [
        {
          "key": "category",
          "match": {
            "value": "example"
          }
        }
      ]
    }
  }
}
```

### recommend_points

Get point recommendations based on positive and negative examples.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "recommend_points",
  "params": {
    "collection_name": "my_collection",
    "positive": [1, 2],
    "negative": [3],
    "limit": 10
  }
}
```

## Project Structure

```
qdrant_mcp/
├── src/
│   ├── api/            # API-related code (for future expansion)
│   ├── config/         # Configuration files
│   ├── generated/      # Generated client code
│   ├── lib/            # Library code (Qdrant client)
│   ├── mcp/            # MCP server implementation
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Application entry point
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project documentation
```

## License

ISC
