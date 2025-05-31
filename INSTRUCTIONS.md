# Instructions for Building a Qdrant Collections MCP Server

## Goal

Create a Node.js-based ModelContextProtocol (MCP) server that wraps the Qdrant **Collections API**. This server should allow structured access to collection management operations such as creating, listing, updating, and deleting collections using MCP-compatible commands.

## Scope

This task is focused **only on the Qdrant Collections API**.

- OpenAPI source:  
  https://github.com/qdrant/qdrant/blob/master/openapi/openapi-collections.ytt.yaml

Later phases will add Points support.

---

## Requirements

### 1. Stack

- **Node.js**
- Use **Fastify** (preferred) or **Express** for the server
- Generate a **typed API client** from the OpenAPI schema
  - Prefer: `openapi-typescript-codegen` or `swagger-typescript-api`
- Environment config via `.env`
  - `QDRANT_URL`
  - `QDRANT_API_KEY`

---

### 2. ModelContextProtocol (MCP)

- Implement [MCP JSON-RPC](https://github.com/modelcontextprotocol/spec) interface
- Each MCP method wraps a specific Qdrant Collections API endpoint

#### Required MCP methods:

| MCP Method         | Description                            |
|--------------------|----------------------------------------|
| `list_collections` | Wraps `GET /collections`               |
| `create_collection`| Wraps `PUT /collections/{name}`        |
| `get_collection`   | Wraps `GET /collections/{name}`        |
| `delete_collection`| Wraps `DELETE /collections/{name}`     |
| `update_collection`| Wraps `PATCH /collections/{name}`      |

- Return clean, structured outputs (don't expose raw Qdrant responses)
- Handle errors gracefully and map them to MCP error codes/messages

---

### 3. Project Layout

Structure the project modularly:

qdrant-mcp/
├── src/
│   ├── client/            # Typed Qdrant API client wrapper
│   ├── mcp/               # MCP method handlers
│   ├── server.ts          # App entry point
│   └── config.ts          # Env var + config loader
├── .env.example
├── index.js               # Entrypoint (compiles or links to server)
├── package.json
└── README.md

---

### 4. Behavior

- Server starts with `node index.js` or `npm start`
- Reads configuration from `.env`
- Provides a health check at `GET /healthz`
- Log structured messages for incoming MCP commands and Qdrant responses
- Wrap Qdrant HTTP calls using a generated client with built-in type safety

---

### 5. Testing & Output

- Include simple `curl` or script-based examples for invoking MCP methods
- Use plain JSON-RPC payloads to test
- Optionally: include example `.mcpconfig` for Roo Code compatibility

---

### 6. Future Expansion (do not implement yet)

Future phases will add MCP methods for:

- Qdrant Points API (add, search, delete vectors)
- Payload filtering
- Batch insertions
- Scrolling large datasets

Focus **only on the Collections API for now**.