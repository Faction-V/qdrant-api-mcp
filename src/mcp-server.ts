#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { QdrantClient } from './lib/qdrant-client.js';
import { EnvConfig } from './config/env.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create configuration
const config: EnvConfig = {
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6335',
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || 'localhost'
};

// Create Qdrant client
const qdrantClient = new QdrantClient(config);

// Create MCP server
const server = new Server(
  {
    name: 'qdrant-collections-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_collections',
        description: 'List all collections in Qdrant',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_collection',
        description: 'Get detailed information about a specific collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection to retrieve',
            },
          },
          required: ['collection_name'],
        },
      },
      {
        name: 'create_collection',
        description: 'Create a new collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the new collection',
            },
            vectors: {
              type: 'object',
              properties: {
                size: {
                  type: 'number',
                  description: 'Vector size',
                },
                distance: {
                  type: 'string',
                  description: 'Distance metric (Cosine, Dot, Euclid)',
                },
              },
              required: ['size', 'distance'],
            },
            shard_number: {
              type: 'number',
              description: 'Number of shards',
            },
            replication_factor: {
              type: 'number',
              description: 'Replication factor',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
            },
          },
          required: ['collection_name', 'vectors'],
        },
      },
      {
        name: 'delete_collection',
        description: 'Delete a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection to delete',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
            },
          },
          required: ['collection_name'],
        },
      },
      {
        name: 'update_collection',
        description: 'Update collection parameters',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection to update',
            },
            optimizers_config: {
              type: 'object',
              description: 'Optimizer configuration',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in seconds',
            },
          },
          required: ['collection_name'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_collections': {
        const response = await qdrantClient.getCollections();
        const collections = response.collections || [];
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                collections: Array.isArray(collections) 
                  ? collections.map(c => c.name) 
                  : []
              }, null, 2),
            },
          ],
        };
      }

      case 'get_collection': {
        const { collection_name } = args as { collection_name: string };
        const collection = await qdrantClient.getCollection(collection_name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(collection, null, 2),
            },
          ],
        };
      }

      case 'create_collection': {
        const { collection_name, timeout, ...collectionParams } = args as any;
        const result = await qdrantClient.createCollection(
          collection_name,
          collectionParams,
          timeout
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: result }, null, 2),
            },
          ],
        };
      }

      case 'delete_collection': {
        const { collection_name, timeout } = args as { collection_name: string; timeout?: number };
        const result = await qdrantClient.deleteCollection(collection_name, timeout);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: result }, null, 2),
            },
          ],
        };
      }

      case 'update_collection': {
        const { collection_name, timeout, ...updateParams } = args as any;
        const result = await qdrantClient.updateCollection(
          collection_name,
          updateParams,
          timeout
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: result }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => {
  process.exit(1);
});