#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LangfuseClient } from './lib/langfuse-client.js';
import { EnvConfig } from './config/env.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create configuration
const config: EnvConfig = {
  LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
  LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
  LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || 'localhost'
};

// Create Langfuse client
const langfuseClient = new LangfuseClient(config);

// Create MCP server
const server = new Server(
  {
    name: 'langfuse-api-server',
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
      // Health
      {
        name: 'health_check',
        description: 'Check health of Langfuse API and database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Annotation Queues
      {
        name: 'list_annotation_queues',
        description: 'Get all annotation queues',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
          },
        },
      },
      {
        name: 'get_annotation_queue',
        description: 'Get an annotation queue by ID',
        inputSchema: {
          type: 'object',
          properties: {
            queueId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue',
            },
          },
          required: ['queueId'],
        },
      },
      {
        name: 'list_annotation_queue_items',
        description: 'Get items for a specific annotation queue',
        inputSchema: {
          type: 'object',
          properties: {
            queueId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue',
            },
            status: {
              type: 'string',
              description: 'Filter by status (PENDING, COMPLETED, SKIPPED)',
            },
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
          },
          required: ['queueId'],
        },
      },
      {
        name: 'create_annotation_queue_item',
        description: 'Add an item to an annotation queue',
        inputSchema: {
          type: 'object',
          properties: {
            queueId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue',
            },
            objectId: {
              type: 'string',
              description: 'The ID of the object to annotate',
            },
            objectType: {
              type: 'string',
              description: 'The type of object to annotate',
            },
          },
          required: ['queueId', 'objectId', 'objectType'],
        },
      },
      {
        name: 'get_annotation_queue_item',
        description: 'Get a specific item from an annotation queue',
        inputSchema: {
          type: 'object',
          properties: {
            queueId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue',
            },
            itemId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue item',
            },
          },
          required: ['queueId', 'itemId'],
        },
      },
      {
        name: 'update_annotation_queue_item',
        description: 'Update an annotation queue item',
        inputSchema: {
          type: 'object',
          properties: {
            queueId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue',
            },
            itemId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue item',
            },
            status: {
              type: 'string',
              description: 'Status to update to (PENDING, COMPLETED, SKIPPED)',
            },
          },
          required: ['queueId', 'itemId'],
        },
      },
      {
        name: 'delete_annotation_queue_item',
        description: 'Remove an item from an annotation queue',
        inputSchema: {
          type: 'object',
          properties: {
            queueId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue',
            },
            itemId: {
              type: 'string',
              description: 'The unique identifier of the annotation queue item',
            },
          },
          required: ['queueId', 'itemId'],
        },
      },

      // Comments
      {
        name: 'create_comment',
        description: 'Create a comment attached to different object types (trace, observation, session, prompt)',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The comment content',
            },
            objectId: {
              type: 'string',
              description: 'The ID of the object to comment on',
            },
            objectType: {
              type: 'string',
              description: 'The type of object (trace, observation, session, prompt)',
            },
          },
          required: ['content', 'objectId', 'objectType'],
        },
      },
      {
        name: 'get_comments',
        description: 'Get all comments with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
            objectType: {
              type: 'string',
              description: 'Filter comments by object type (trace, observation, session, prompt)',
            },
            objectId: {
              type: 'string',
              description: 'Filter comments by object id',
            },
            authorUserId: {
              type: 'string',
              description: 'Filter comments by author user id',
            },
          },
        },
      },
      {
        name: 'get_comment',
        description: 'Get a comment by id',
        inputSchema: {
          type: 'object',
          properties: {
            commentId: {
              type: 'string',
              description: 'The unique langfuse identifier of a comment',
            },
          },
          required: ['commentId'],
        },
      },

      // Dataset Items
      {
        name: 'create_dataset_item',
        description: 'Create a dataset item',
        inputSchema: {
          type: 'object',
          properties: {
            datasetName: {
              type: 'string',
              description: 'Name of the dataset',
            },
            input: {
              type: 'object',
              description: 'Input data for the dataset item',
            },
            expectedOutput: {
              type: 'object',
              description: 'Expected output for the dataset item',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
            sourceTraceId: {
              type: 'string',
              description: 'Source trace ID if created from a trace',
            },
            sourceObservationId: {
              type: 'string',
              description: 'Source observation ID if created from an observation',
            },
          },
          required: ['datasetName'],
        },
      },
      {
        name: 'list_dataset_items',
        description: 'Get dataset items with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            datasetName: {
              type: 'string',
              description: 'Filter by dataset name',
            },
            sourceTraceId: {
              type: 'string',
              description: 'Filter by source trace ID',
            },
            sourceObservationId: {
              type: 'string',
              description: 'Filter by source observation ID',
            },
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
          },
        },
      },
      {
        name: 'get_dataset_item',
        description: 'Get a dataset item by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The dataset item ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_dataset_item',
        description: 'Delete a dataset item and all its run items (irreversible)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The dataset item ID',
            },
          },
          required: ['id'],
        },
      },

      // Datasets
      {
        name: 'list_datasets',
        description: 'Get all datasets',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
          },
        },
      },
      {
        name: 'create_dataset',
        description: 'Create a dataset',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the dataset',
            },
            description: {
              type: 'string',
              description: 'Description of the dataset',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'get_dataset',
        description: 'Get a dataset by name',
        inputSchema: {
          type: 'object',
          properties: {
            datasetName: {
              type: 'string',
              description: 'Name of the dataset',
            },
          },
          required: ['datasetName'],
        },
      },

      // Traces
      {
        name: 'list_traces',
        description: 'Get list of traces with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
            userId: {
              type: 'string',
              description: 'Filter by user ID',
            },
            name: {
              type: 'string',
              description: 'Filter by trace name',
            },
            sessionId: {
              type: 'string',
              description: 'Filter by session ID',
            },
            fromTimestamp: {
              type: 'string',
              description: 'Filter traces from this timestamp (ISO format)',
            },
            toTimestamp: {
              type: 'string',
              description: 'Filter traces to this timestamp (ISO format)',
            },
            orderBy: {
              type: 'string',
              description: 'Order by field',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
          },
        },
      },
      {
        name: 'get_trace',
        description: 'Get a specific trace by ID',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: {
              type: 'string',
              description: 'The trace ID',
            },
          },
          required: ['traceId'],
        },
      },
      {
        name: 'delete_trace',
        description: 'Delete a specific trace',
        inputSchema: {
          type: 'object',
          properties: {
            traceId: {
              type: 'string',
              description: 'The trace ID',
            },
          },
          required: ['traceId'],
        },
      },

      // Observations
      {
        name: 'get_observation',
        description: 'Get an observation by ID',
        inputSchema: {
          type: 'object',
          properties: {
            observationId: {
              type: 'string',
              description: 'The observation ID',
            },
          },
          required: ['observationId'],
        },
      },
      {
        name: 'list_observations',
        description: 'Get a list of observations with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
            traceId: {
              type: 'string',
              description: 'Filter by trace ID',
            },
            name: {
              type: 'string',
              description: 'Filter by observation name',
            },
            userId: {
              type: 'string',
              description: 'Filter by user ID',
            },
            type: {
              type: 'string',
              description: 'Filter by observation type (GENERATION, SPAN, EVENT)',
            },
            fromStartTime: {
              type: 'string',
              description: 'Filter observations from this start time (ISO format)',
            },
            toStartTime: {
              type: 'string',
              description: 'Filter observations to this start time (ISO format)',
            },
          },
        },
      },

      // Sessions
      {
        name: 'list_sessions',
        description: 'Get sessions with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
            fromTimestamp: {
              type: 'string',
              description: 'Filter sessions from this timestamp (ISO format)',
            },
            toTimestamp: {
              type: 'string',
              description: 'Filter sessions to this timestamp (ISO format)',
            },
          },
        },
      },
      {
        name: 'get_session',
        description: 'Get a session by ID',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID',
            },
          },
          required: ['sessionId'],
        },
      },

      // Scores
      {
        name: 'create_score',
        description: 'Create a score (supports both trace and session scores)',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the score',
            },
            value: {
              type: 'number',
              description: 'Numeric value of the score',
            },
            traceId: {
              type: 'string',
              description: 'ID of the trace to score',
            },
            observationId: {
              type: 'string',
              description: 'ID of the observation to score (optional)',
            },
            comment: {
              type: 'string',
              description: 'Optional comment about the score',
            },
          },
          required: ['name', 'value', 'traceId'],
        },
      },
      {
        name: 'list_scores',
        description: 'Get a list of scores with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
            userId: {
              type: 'string',
              description: 'Filter by user ID',
            },
            name: {
              type: 'string',
              description: 'Filter by score name',
            },
            fromTimestamp: {
              type: 'string',
              description: 'Filter scores from this timestamp (ISO format)',
            },
            toTimestamp: {
              type: 'string',
              description: 'Filter scores to this timestamp (ISO format)',
            },
            source: {
              type: 'string',
              description: 'Filter by score source',
            },
          },
        },
      },
      {
        name: 'get_score',
        description: 'Get a score by ID',
        inputSchema: {
          type: 'object',
          properties: {
            scoreId: {
              type: 'string',
              description: 'The score ID',
            },
          },
          required: ['scoreId'],
        },
      },
      {
        name: 'delete_score',
        description: 'Delete a score',
        inputSchema: {
          type: 'object',
          properties: {
            scoreId: {
              type: 'string',
              description: 'The score ID',
            },
          },
          required: ['scoreId'],
        },
      },

      // Models
      {
        name: 'create_model',
        description: 'Create a model configuration',
        inputSchema: {
          type: 'object',
          properties: {
            modelName: {
              type: 'string',
              description: 'Name of the model',
            },
            matchPattern: {
              type: 'string',
              description: 'Pattern to match model usage',
            },
            startDate: {
              type: 'string',
              description: 'Start date for model pricing (ISO format)',
            },
            inputPrice: {
              type: 'number',
              description: 'Price per input unit',
            },
            outputPrice: {
              type: 'number',
              description: 'Price per output unit',
            },
            totalPrice: {
              type: 'number',
              description: 'Total price per unit',
            },
            unit: {
              type: 'string',
              description: 'Pricing unit (TOKENS, CHARACTERS, REQUESTS, SECONDS)',
            },
            tokenizerId: {
              type: 'string',
              description: 'Tokenizer ID',
            },
            tokenizerConfig: {
              type: 'object',
              description: 'Tokenizer configuration',
            },
          },
          required: ['modelName', 'matchPattern', 'unit'],
        },
      },
      {
        name: 'list_models',
        description: 'Get all models',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number, starts at 1',
            },
            limit: {
              type: 'number',
              description: 'Limit of items per page',
            },
          },
        },
      },
      {
        name: 'get_model',
        description: 'Get a model by ID',
        inputSchema: {
          type: 'object',
          properties: {
            modelId: {
              type: 'string',
              description: 'The model ID',
            },
          },
          required: ['modelId'],
        },
      },
      {
        name: 'delete_model',
        description: 'Delete a model configuration',
        inputSchema: {
          type: 'object',
          properties: {
            modelId: {
              type: 'string',
              description: 'The model ID',
            },
          },
          required: ['modelId'],
        },
      },

      // Projects
      {
        name: 'get_projects',
        description: 'Get Project associated with API key',
        inputSchema: {
          type: 'object',
          properties: {},
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
      // Health
      case 'health_check':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.healthCheck(), null, 2),
            },
          ],
        };

      // Annotation Queues
      case 'list_annotation_queues':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listAnnotationQueues(args as any), null, 2),
            },
          ],
        };

      case 'get_annotation_queue':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getAnnotationQueue((args as any)?.queueId), null, 2),
            },
          ],
        };

      case 'list_annotation_queue_items':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listAnnotationQueueItems((args as any)?.queueId, args as any), null, 2),
            },
          ],
        };

      case 'create_annotation_queue_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.createAnnotationQueueItem((args as any)?.queueId, {
                objectId: (args as any)?.objectId,
                objectType: (args as any)?.objectType,
              }), null, 2),
            },
          ],
        };

      case 'get_annotation_queue_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getAnnotationQueueItem((args as any)?.queueId, (args as any)?.itemId), null, 2),
            },
          ],
        };

      case 'update_annotation_queue_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.updateAnnotationQueueItem((args as any)?.queueId, (args as any)?.itemId, {
                status: (args as any)?.status,
              }), null, 2),
            },
          ],
        };

      case 'delete_annotation_queue_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.deleteAnnotationQueueItem((args as any)?.queueId, (args as any)?.itemId), null, 2),
            },
          ],
        };

      // Comments
      case 'create_comment':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.createComment({
                content: (args as any)?.content,
                objectId: (args as any)?.objectId,
                objectType: (args as any)?.objectType,
              }), null, 2),
            },
          ],
        };

      case 'get_comments':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getComments(args as any), null, 2),
            },
          ],
        };

      case 'get_comment':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getComment((args as any)?.commentId), null, 2),
            },
          ],
        };

      // Dataset Items
      case 'create_dataset_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.createDatasetItem(args as any), null, 2),
            },
          ],
        };

      case 'list_dataset_items':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listDatasetItems(args as any), null, 2),
            },
          ],
        };

      case 'get_dataset_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getDatasetItem((args as any)?.id), null, 2),
            },
          ],
        };

      case 'delete_dataset_item':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.deleteDatasetItem((args as any)?.id), null, 2),
            },
          ],
        };

      // Datasets
      case 'list_datasets':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listDatasets(args as any), null, 2),
            },
          ],
        };

      case 'create_dataset':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.createDataset(args as any), null, 2),
            },
          ],
        };

      case 'get_dataset':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getDataset((args as any)?.datasetName), null, 2),
            },
          ],
        };

      // Traces
      case 'list_traces':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listTraces(args as any), null, 2),
            },
          ],
        };

      case 'get_trace':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getTrace((args as any)?.traceId), null, 2),
            },
          ],
        };

      case 'delete_trace':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.deleteTrace((args as any)?.traceId), null, 2),
            },
          ],
        };

      // Observations
      case 'get_observation':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getObservation((args as any)?.observationId), null, 2),
            },
          ],
        };

      case 'list_observations':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listObservations(args as any), null, 2),
            },
          ],
        };

      // Sessions
      case 'list_sessions':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listSessions(args as any), null, 2),
            },
          ],
        };

      case 'get_session':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getSession((args as any)?.sessionId), null, 2),
            },
          ],
        };

      // Scores
      case 'create_score':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.createScore(args as any), null, 2),
            },
          ],
        };

      case 'list_scores':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listScores(args as any), null, 2),
            },
          ],
        };

      case 'get_score':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getScore((args as any)?.scoreId), null, 2),
            },
          ],
        };

      case 'delete_score':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.deleteScore((args as any)?.scoreId), null, 2),
            },
          ],
        };

      // Models
      case 'create_model':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.createModel(args as any), null, 2),
            },
          ],
        };

      case 'list_models':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.listModels(args as any), null, 2),
            },
          ],
        };

      case 'get_model':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getModel((args as any)?.modelId), null, 2),
            },
          ],
        };

      case 'delete_model':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.deleteModel((args as any)?.modelId), null, 2),
            },
          ],
        };

      // Projects
      case 'get_projects':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await langfuseClient.getProjects(), null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
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
  console.error('Langfuse MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});