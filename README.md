# Qdrant MCP Server

A Model Context Protocol (MCP) server that wraps the Qdrant Collections API.

## Features

- Implements the MCP JSON-RPC specification
- Provides access to Qdrant Collections API
- Supports the following operations:
  - `list_collections`: Get a list of all collections
  - `create_collection`: Create a new collection
  - `get_collection`: Get detailed information about a collection
  - `delete_collection`: Delete a collection
  - `update_collection`: Update collection parameters
- Built with TypeScript, Fastify, and Axios
- Structured for future expansion to support Qdrant's Points API

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