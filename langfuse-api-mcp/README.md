# Langfuse MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to the Langfuse API for LLM observability and analytics.

## Features

This MCP server provides access to all major Langfuse API endpoints:

### Core Operations
- **Health Check** - Monitor API status
- **Traces** - List, get, and delete execution traces
- **Observations** - Access generations, spans, and events
- **Sessions** - Manage user sessions
- **Scores** - Create and manage evaluation scores

### Data Management
- **Datasets** - Create and manage evaluation datasets
- **Dataset Items** - Add and manage dataset entries
- **Comments** - Add comments to traces, observations, sessions, and prompts

### Annotation & Review
- **Annotation Queues** - Manage human annotation workflows
- **Queue Items** - Create, update, and manage annotation tasks

### Configuration
- **Models** - Configure model pricing and tokenization
- **Score Configs** - Define scoring schemas

## Installation

1. Install dependencies:
```bash
cd langfuse-api-mcp
npm install
```

2. Build the project:
```bash
npm run build
```

## Configuration

Set the following environment variables:

```bash
# Required
LANGFUSE_PUBLIC_KEY=your_public_key
LANGFUSE_SECRET_KEY=your_secret_key

# Optional
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # Default
PORT=3001                                      # Default
HOST=localhost                                 # Default
```

## Usage

### Running the MCP Server

```bash
# Start the MCP server
npm run start:mcp

# Or run in development mode
npm run dev:mcp
```

### Using with MCP Inspector

```bash
# Start the inspector (requires environment variables to be set)
just inspect

# Open inspector in browser
just open-inspector
```

### Available Tools

The server provides 30+ tools covering all major Langfuse operations:

#### Health & Status
- `health_check` - Check API health

#### Traces & Observations
- `list_traces` - Get traces with filtering
- `get_trace` - Get specific trace
- `delete_trace` - Delete trace
- `get_observation` - Get observation details
- `list_observations` - List observations with filtering

#### Sessions & Scores
- `list_sessions` - Get user sessions
- `get_session` - Get specific session
- `create_score` - Create evaluation scores
- `list_scores` - List scores with filtering
- `get_score` - Get specific score
- `delete_score` - Delete score

#### Datasets
- `list_datasets` - Get all datasets
- `create_dataset` - Create new dataset
- `get_dataset` - Get dataset details
- `create_dataset_item` - Add items to datasets
- `list_dataset_items` - List dataset items
- `get_dataset_item` - Get specific dataset item
- `delete_dataset_item` - Delete dataset item

#### Comments
- `create_comment` - Add comments to objects
- `get_comments` - List comments with filtering
- `get_comment` - Get specific comment

#### Annotation Queues
- `list_annotation_queues` - Get annotation queues
- `get_annotation_queue` - Get queue details
- `list_annotation_queue_items` - Get queue items
- `create_annotation_queue_item` - Add items to queue
- `get_annotation_queue_item` - Get queue item
- `update_annotation_queue_item` - Update queue item status
- `delete_annotation_queue_item` - Remove from queue

#### Models
- `create_model` - Configure model pricing
- `list_models` - Get model configurations
- `get_model` - Get specific model config
- `delete_model` - Delete model config

## Examples

### Basic Usage

```javascript
// List recent traces
{
  "tool": "list_traces",
  "arguments": {
    "limit": 10,
    "orderBy": "timestamp"
  }
}

// Get specific trace
{
  "tool": "get_trace",
  "arguments": {
    "traceId": "trace-123"
  }
}

// Create evaluation score
{
  "tool": "create_score",
  "arguments": {
    "name": "quality",
    "value": 0.85,
    "traceId": "trace-123",
    "comment": "High quality response"
  }
}
```

### Dataset Management

```javascript
// Create dataset
{
  "tool": "create_dataset",
  "arguments": {
    "name": "evaluation-set-v1",
    "description": "Test cases for model evaluation"
  }
}

// Add dataset item
{
  "tool": "create_dataset_item",
  "arguments": {
    "datasetName": "evaluation-set-v1",
    "input": {"question": "What is AI?"},
    "expectedOutput": {"answer": "Artificial Intelligence..."}
  }
}
```

### Annotation Workflow

```javascript
// Add item to annotation queue
{
  "tool": "create_annotation_queue_item",
  "arguments": {
    "queueId": "queue-123",
    "objectId": "trace-456",
    "objectType": "trace"
  }
}

// Update annotation status
{
  "tool": "update_annotation_queue_item",
  "arguments": {
    "queueId": "queue-123",
    "itemId": "item-789",
    "status": "COMPLETED"
  }
}
```

## Development

### Project Structure

```
langfuse-api-mcp/
├── src/
│   ├── config/
│   │   └── env.ts           # Environment configuration
│   ├── lib/
│   │   └── langfuse-client.ts # Langfuse API client
│   └── mcp-server.ts        # MCP server implementation
├── openapi.yml              # Langfuse OpenAPI specification
├── package.json
├── tsconfig.json
├── justfile                 # Task runner
└── README.md
```

### Available Commands

```bash
# Development
npm run dev:mcp              # Run in development mode
npm run build                # Build TypeScript
npm run start:mcp            # Start production server

# Using justfile
just install                 # Install dependencies
just build                   # Build project
just dev                     # Run in development
just inspect                 # Start MCP inspector
just open-inspector          # Open inspector in browser
```

## Authentication

The server uses Langfuse's Basic Authentication:
- **Username**: Your Langfuse Public Key
- **Password**: Your Langfuse Secret Key

Get your API keys from your Langfuse project settings.

## Error Handling

The server includes comprehensive error handling:
- Network timeouts (30 seconds)
- Authentication errors
- API rate limiting
- Invalid parameters
- Missing resources

All errors are returned in a structured format with descriptive messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License