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
    name: 'qdrant-api-server',
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
      // Points operations
      {
        name: 'upsert_points',
        description: 'Insert or update points in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            points: {
              type: 'array',
              description: 'Array of points to upsert',
              items: {
                type: 'object',
                properties: {
                  id: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'number' }
                    ],
                    description: 'Point ID',
                  },
                  vector: {
                    oneOf: [
                      {
                        type: 'array',
                        items: { type: 'number' },
                        description: 'Dense vector',
                      },
                      {
                        type: 'object',
                        description: 'Named vectors',
                      }
                    ],
                  },
                  payload: {
                    type: 'object',
                    description: 'Point payload',
                  },
                },
                required: ['id'],
              },
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
            },
          },
          required: ['collection_name', 'points'],
        },
      },
      {
        name: 'search_points',
        description: 'Search for similar points in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection to search in',
            },
            vector: {
              type: 'array',
              items: { type: 'number' },
              description: 'Query vector',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions',
            },
            score_threshold: {
              type: 'number',
              description: 'Minimum score threshold',
            },
            with_payload: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Include payload in results',
            },
            with_vector: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Include vector in results',
            },
          },
          required: ['collection_name', 'vector'],
        },
      },
      {
        name: 'scroll_points',
        description: 'Scroll through points in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            offset: {
              oneOf: [
                { type: 'string' },
                { type: 'number' }
              ],
              description: 'Offset point ID for pagination',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of points to return',
              default: 10,
            },
            filter: {
              type: 'object',
              description: 'Filter conditions',
            },
            with_payload: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Include payload in results',
            },
            with_vector: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Include vector in results',
            },
          },
          required: ['collection_name'],
        },
      },
      {
        name: 'count_points',
        description: 'Count points in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions',
            },
            exact: {
              type: 'boolean',
              description: 'Use exact counting',
            },
          },
          required: ['collection_name'],
        },
      },
      {
        name: 'recommend_points',
        description: 'Get point recommendations based on positive and negative examples',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            positive: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Positive example point IDs',
            },
            negative: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Negative example point IDs',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions',
            },
            score_threshold: {
              type: 'number',
              description: 'Minimum score threshold',
            },
            with_payload: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Include payload in results',
            },
            with_vector: {
              oneOf: [
                { type: 'boolean' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Include vector in results',
            },
          },
          required: ['collection_name', 'positive'],
        },
      },
      {
        name: 'get_point',
        description: 'Get a single point by ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            point_id: {
              oneOf: [
                { type: 'string' },
                { type: 'number' }
              ],
              description: 'ID of the point to retrieve',
            },
          },
          required: ['collection_name', 'point_id'],
        },
      },
      {
        name: 'delete_point',
        description: 'Delete a single point by ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            point_id: {
              oneOf: [
                { type: 'string' },
                { type: 'number' }
              ],
              description: 'ID of the point to delete',
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
            },
          },
          required: ['collection_name', 'point_id'],
        },
      },
      {
        name: 'delete_points',
        description: 'Delete multiple points by filter or IDs',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            points: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Array of point IDs to delete',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions for points to delete',
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
            },
          },
          required: ['collection_name'],
        },
      },
      {
        name: 'set_payload',
        description: 'Set payload for points',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            payload: {
              type: 'object',
              description: 'Payload to set',
            },
            points: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Array of point IDs',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions for points',
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
            },
          },
          required: ['collection_name', 'payload'],
        },
      },
      {
        name: 'overwrite_payload',
        description: 'Overwrite payload for points',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            payload: {
              type: 'object',
              description: 'Payload to set',
            },
            points: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Array of point IDs',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions for points',
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
            },
          },
          required: ['collection_name', 'payload'],
        },
      },
      {
        name: 'delete_payload',
        description: 'Delete specific payload keys from points',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            keys: {
              type: 'array',
              items: { type: 'string' },
              description: 'Payload keys to delete',
            },
            points: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Array of point IDs',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions for points',
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
            },
          },
          required: ['collection_name', 'keys'],
        },
      },
      {
        name: 'clear_payload',
        description: 'Clear all payload from points',
        inputSchema: {
          type: 'object',
          properties: {
            collection_name: {
              type: 'string',
              description: 'Name of the collection',
            },
            points: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' }
                ]
              },
              description: 'Array of point IDs',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions for points',
            },
            wait: {
              type: 'boolean',
              description: 'Wait for changes to actually happen',
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

      // Points operations
      case 'upsert_points': {
        const { collection_name, points, wait } = args as any;
        const result = await qdrantClient.upsertPoints(
          collection_name,
          { points },
          wait
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_points': {
        const { collection_name, ...searchParams } = args as any;
        const result = await qdrantClient.searchPoints(collection_name, searchParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'scroll_points': {
        const { collection_name, ...scrollParams } = args as any;
        const result = await qdrantClient.scrollPoints(collection_name, scrollParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'count_points': {
        const { collection_name, ...countParams } = args as any;
        const result = await qdrantClient.countPoints(collection_name, countParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'recommend_points': {
        const { collection_name, ...recommendParams } = args as any;
        const result = await qdrantClient.recommendPoints(collection_name, recommendParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_point': {
        const { collection_name, point_id } = args as any;
        const result = await qdrantClient.getPoint(collection_name, point_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_point': {
        const { collection_name, point_id, wait } = args as any;
        const result = await qdrantClient.deletePoint(collection_name, point_id, wait);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_points': {
        const { collection_name, wait, ...deleteParams } = args as any;
        const result = await qdrantClient.deletePoints(collection_name, deleteParams, wait);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'set_payload': {
        const { collection_name, wait, ...payloadParams } = args as any;
        const result = await qdrantClient.setPayload(collection_name, payloadParams, wait);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'overwrite_payload': {
        const { collection_name, wait, ...payloadParams } = args as any;
        const result = await qdrantClient.overwritePayload(collection_name, payloadParams, wait);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_payload': {
        const { collection_name, wait, ...deleteParams } = args as any;
        const result = await qdrantClient.deletePayload(collection_name, deleteParams, wait);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'clear_payload': {
        const { collection_name, wait, ...clearParams } = args as any;
        const result = await qdrantClient.clearPayload(collection_name, clearParams, wait);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
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