#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const http_1 = require("http");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const dotenv_1 = __importDefault(require("dotenv"));
const pino_1 = __importDefault(require("pino"));
const cluster_manager_js_1 = require("./lib/cluster-manager.js");
const rate_limiter_js_1 = require("./lib/rate-limiter.js");
dotenv_1.default.config();
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
}, process.stderr);
const baseConfig = {
    QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6335',
    QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || 'localhost',
};
const clusterEnv = parseClusterProfiles(logger);
const clusterManager = new cluster_manager_js_1.ClusterManager(baseConfig, clusterEnv.profiles, clusterEnv.defaultCluster);
const rateLimiter = new rate_limiter_js_1.RateLimiter({
    windowMs: parseInt(process.env.MCP_RATE_LIMIT_WINDOW_MS || '1000', 10),
    maxRequests: parseInt(process.env.MCP_RATE_LIMIT_MAX_REQUESTS || '10', 10),
});
const serverInfo = {
    name: 'qdrant-api-server',
    version: '1.1.0',
};
const PROTOCOL_VERSION = '2024-11-05';
const serverCapabilities = {
    tools: {},
    resources: {},
};
const server = new index_js_1.Server(serverInfo, {
    capabilities: serverCapabilities,
});
const clusterInputProperty = {
    cluster: {
        type: 'string',
        description: 'Optional cluster profile name. Defaults to the active cluster set via switch_cluster. Mutually exclusive with cluster_url.',
    },
    cluster_url: {
        type: 'string',
        description: 'Optional dynamic cluster URL. When provided, connects to this cluster directly. Mutually exclusive with cluster.',
    },
    cluster_api_key: {
        type: 'string',
        description: 'Optional API key for the dynamic cluster. Only used when cluster_url is provided.',
    },
};
const clusterAwareTools = [
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
                                    { type: 'number' },
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
                                    },
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
                            items: { type: 'string' },
                        },
                    ],
                    description: 'Include payload in results',
                },
                with_vector: {
                    oneOf: [
                        { type: 'boolean' },
                        {
                            type: 'array',
                            items: { type: 'string' },
                        },
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
                        { type: 'number' },
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
                            items: { type: 'string' },
                        },
                    ],
                    description: 'Include payload in results',
                },
                with_vector: {
                    oneOf: [
                        { type: 'boolean' },
                        {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    ],
                    description: 'Include vector in results',
                },
            },
            required: ['collection_name'],
        },
    },
    {
        name: 'scroll_points_paginated',
        description: 'Scroll with resumable cursor support for long-running jobs',
        inputSchema: {
            type: 'object',
            properties: {
                collection_name: {
                    type: 'string',
                    description: 'Collection to read when cursor is not provided',
                },
                cursor: {
                    type: 'string',
                    description: 'Resume token returned by a previous scroll_points_paginated call',
                },
                offset: {
                    oneOf: [
                        { type: 'string' },
                        { type: 'number' },
                    ],
                    description: 'Starting offset when not resuming via cursor',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of points to return',
                    default: 64,
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
                            items: { type: 'string' },
                        },
                    ],
                    description: 'Include payload in results',
                },
                with_vector: {
                    oneOf: [
                        { type: 'boolean' },
                        {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    ],
                    description: 'Include vector in results',
                },
            },
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
                            { type: 'number' },
                        ],
                    },
                    description: 'Positive example point IDs',
                },
                negative: {
                    type: 'array',
                    items: {
                        oneOf: [
                            { type: 'string' },
                            { type: 'number' },
                        ],
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
                            items: { type: 'string' },
                        },
                    ],
                    description: 'Include payload in results',
                },
                with_vector: {
                    oneOf: [
                        { type: 'boolean' },
                        {
                            type: 'array',
                            items: { type: 'string' },
                        },
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
                        { type: 'number' },
                    ],
                    description: 'ID of the point to retrieve',
                },
            },
            required: ['collection_name', 'point_id'],
        },
    },
    {
        name: 'describe_point',
        description: 'Fetch payload, vector, and shard information for a point',
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
                        { type: 'number' },
                    ],
                    description: 'ID of the point to describe',
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
                        { type: 'number' },
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
                            { type: 'number' },
                        ],
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
                            { type: 'number' },
                        ],
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
                            { type: 'number' },
                        ],
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
                            { type: 'number' },
                        ],
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
                            { type: 'number' },
                        ],
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
    {
        name: 'count_unique_by_field',
        description: 'Count unique values of a specified payload field across points in a collection. Useful for counting unique documents by external_id or other grouping fields. Returns the total count of unique values and optionally a breakdown by value.',
        inputSchema: {
            type: 'object',
            properties: {
                collection_name: {
                    type: 'string',
                    description: 'Name of the collection',
                },
                field_name: {
                    type: 'string',
                    description: 'The payload field to aggregate unique values from (e.g., "external_id" for unique documents)',
                },
                filter: {
                    type: 'object',
                    description: 'Optional filter conditions to apply before counting',
                },
                include_breakdown: {
                    type: 'boolean',
                    description: 'If true, return a breakdown of counts per unique value. If false, return only the total count of unique values. Default: false',
                    default: false,
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of unique values to include in breakdown (only used when include_breakdown=true). Default: 100',
                    default: 100,
                },
            },
            required: ['collection_name', 'field_name'],
        },
    },
];
const switchClusterTool = {
    name: 'switch_cluster',
    description: 'Return or update the active cluster profile used by default',
    inputSchema: {
        type: 'object',
        properties: {
            cluster: {
                type: 'string',
                description: 'Cluster name to activate. Leave blank to read current state.',
            },
        },
    },
    supportsCluster: false,
};
const toolDefinitions = [
    ...clusterAwareTools.map((tool) => ({
        ...tool,
        supportsCluster: tool.supportsCluster ?? true,
    })),
    switchClusterTool,
];
server.setRequestHandler(types_js_1.InitializeRequestSchema, async () => {
    const profileNames = clusterManager.listProfiles().map((profile) => profile.name);
    return {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo,
        capabilities: serverCapabilities,
        metadata: {
            transports: ['stdio'],
            rateLimit: rateLimiter.describe(),
            activeCluster: clusterManager.getActiveClusterName(),
            availableClusters: profileNames,
        },
    };
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: toolDefinitions.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.supportsCluster === false
                ? tool.inputSchema
                : {
                    ...tool.inputSchema,
                    properties: {
                        ...tool.inputSchema.properties,
                        ...clusterInputProperty,
                    },
                },
        })),
    };
});
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
    const active = clusterManager.getActiveClusterName();
    return {
        resources: clusterManager.listProfiles().map((profile) => ({
            uri: clusterResourceUri(profile.name),
            name: `${profile.name} cluster`,
            description: profile.description || `Qdrant cluster at ${profile.url}`,
            mimeType: 'application/json',
            metadata: {
                readOnly: profile.readOnly ?? false,
                labels: profile.labels ?? [],
                active: profile.name === active,
            },
        })),
    };
});
server.setRequestHandler(types_js_1.ListResourceTemplatesRequestSchema, async () => {
    return {
        resourceTemplates: [
            {
                uriTemplate: 'qdrant://clusters/{cluster}',
                name: 'Cluster overview',
                description: 'Provides metadata about a configured Qdrant cluster including available collections, rate limits, and safety hints.',
                mimeType: 'application/json',
            },
        ],
    };
});
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const clusterMatch = /^qdrant:\/\/clusters\/(?<cluster>[A-Za-z0-9_-]+)$/u.exec(uri);
    if (!clusterMatch || !clusterMatch.groups) {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'text/plain',
                    text: `Unknown resource: ${uri}`,
                },
            ],
        };
    }
    const clusterName = clusterMatch.groups.cluster;
    const { client, profile } = clusterManager.getClient(clusterName);
    const resourcePayload = await buildClusterResourcePayload(client, profile);
    return {
        contents: [
            {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(resourcePayload, null, 2),
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = (request.params.arguments || {});
    const clusterForLimit = typeof args.cluster === 'string'
        ? args.cluster
        : clusterManager.getActiveClusterName();
    const startTime = Date.now();
    try {
        rateLimiter.consume(`${toolName}:${clusterForLimit}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Rate limit exceeded';
        logger.warn({ tool: toolName, cluster: clusterForLimit }, message);
        return errorContent(message);
    }
    try {
        let result;
        switch (toolName) {
            case 'list_collections': {
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.getCollections();
                    const collections = response.collections?.map((c) => c.name) ?? [];
                    return jsonContent({ cluster: profile.name, collections });
                });
                break;
            }
            case 'get_collection': {
                const { collection_name } = args;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const collection = await client.getCollection(collection_name);
                    return jsonContent({ cluster: profile.name, collection });
                });
                break;
            }
            case 'create_collection': {
                const { cluster: _cluster, ...rawCreateArgs } = args;
                const { collection_name, timeout, ...collectionParams } = rawCreateArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const success = await client.createCollection(collection_name, collectionParams, timeout);
                    return jsonContent({ cluster: profile.name, success });
                });
                break;
            }
            case 'delete_collection': {
                const { collection_name, timeout } = args;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const success = await client.deleteCollection(collection_name, timeout);
                    return jsonContent({ cluster: profile.name, success });
                });
                break;
            }
            case 'update_collection': {
                const { cluster: _cluster, ...rawUpdateArgs } = args;
                const { collection_name, timeout, ...updateParams } = rawUpdateArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const success = await client.updateCollection(collection_name, updateParams, timeout);
                    return jsonContent({ cluster: profile.name, success });
                });
                break;
            }
            case 'upsert_points': {
                const { collection_name, points, wait } = args;
                if (!collection_name || !Array.isArray(points)) {
                    throw new Error('collection_name and points are required');
                }
                const typedPoints = points;
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.upsertPoints(collection_name, { points: typedPoints }, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'search_points': {
                const { cluster: _cluster, ...rawSearchArgs } = args;
                const { collection_name, ...searchParams } = rawSearchArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.searchPoints(collection_name, searchParams);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'scroll_points': {
                const { cluster: _cluster, ...rawScrollArgs } = args;
                const { collection_name, ...scrollParams } = rawScrollArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.scrollPoints(collection_name, scrollParams);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'scroll_points_paginated': {
                result = await handlePaginatedScroll(args);
                break;
            }
            case 'count_points': {
                const { cluster: _cluster, ...rawCountArgs } = args;
                const { collection_name, ...countParams } = rawCountArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.countPoints(collection_name, countParams);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'count_unique_by_field': {
                const { cluster: _cluster, ...rawArgs } = args;
                const { collection_name, field_name, filter, include_breakdown = false, limit = 100, } = rawArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                if (!field_name) {
                    throw new Error('field_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    // Scroll through all points to aggregate unique field values
                    const uniqueValues = new Map();
                    let offset = undefined;
                    let hasMore = true;
                    const scrollLimit = 1000; // Batch size for scrolling
                    while (hasMore) {
                        const scrollResult = await client.scrollPoints(collection_name, {
                            filter,
                            limit: scrollLimit,
                            offset,
                            with_payload: true,
                            with_vector: false,
                        });
                        // Extract unique values from the specified field
                        for (const point of scrollResult.points || []) {
                            if (point.payload && field_name in point.payload) {
                                const value = point.payload[field_name];
                                // Convert to string for consistent Map key
                                const key = String(value);
                                uniqueValues.set(key, (uniqueValues.get(key) || 0) + 1);
                            }
                        }
                        // Check if there are more points to scroll
                        offset = scrollResult.next_page_offset;
                        hasMore = offset !== null && offset !== undefined;
                    }
                    const totalUniqueCount = uniqueValues.size;
                    const response = {
                        count: totalUniqueCount,
                        field_name,
                    };
                    if (include_breakdown) {
                        // Convert Map to array and sort by count descending
                        const breakdown = Array.from(uniqueValues.entries())
                            .map(([value, count]) => ({ value, count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, limit);
                        response.breakdown = breakdown;
                        response.breakdown_truncated = uniqueValues.size > limit;
                    }
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'recommend_points': {
                const { cluster: _cluster, ...rawRecommendArgs } = args;
                const { collection_name, ...recommendParams } = rawRecommendArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.recommendPoints(collection_name, recommendParams);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'get_point': {
                const { collection_name, point_id } = args;
                if (!collection_name || point_id === undefined) {
                    throw new Error('collection_name and point_id are required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.getPoint(collection_name, point_id);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'describe_point': {
                result = await describePoint(args);
                break;
            }
            case 'delete_point': {
                const { collection_name, point_id, wait } = args;
                if (!collection_name || point_id === undefined) {
                    throw new Error('collection_name and point_id are required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.deletePoint(collection_name, point_id, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'delete_points': {
                const { cluster: _cluster, ...rawDeleteArgs } = args;
                const { collection_name, wait, ...deleteParams } = rawDeleteArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.deletePoints(collection_name, deleteParams, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'set_payload': {
                const { cluster: _cluster, ...rawPayloadArgs } = args;
                const { collection_name, wait, ...payloadParams } = rawPayloadArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.setPayload(collection_name, payloadParams, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'overwrite_payload': {
                const { cluster: _cluster, ...rawOverwriteArgs } = args;
                const { collection_name, wait, ...payloadParams } = rawOverwriteArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.overwritePayload(collection_name, payloadParams, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'delete_payload': {
                const { cluster: _cluster, ...rawDeletePayloadArgs } = args;
                const { collection_name, wait, ...deleteParams } = rawDeletePayloadArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.deletePayload(collection_name, deleteParams, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'clear_payload': {
                const { cluster: _cluster, ...rawClearArgs } = args;
                const { collection_name, wait, ...clearParams } = rawClearArgs;
                if (!collection_name) {
                    throw new Error('collection_name is required');
                }
                result = await runClusterTool(args, async (client, profile) => {
                    const response = await client.clearPayload(collection_name, clearParams, wait);
                    return jsonContent({ cluster: profile.name, response });
                });
                break;
            }
            case 'switch_cluster': {
                const { cluster } = args;
                if (cluster) {
                    const profile = clusterManager.setActiveCluster(cluster);
                    result = jsonContent({
                        activeCluster: sanitizeProfile(profile),
                    });
                }
                else {
                    result = jsonContent({
                        activeCluster: sanitizeProfile(clusterManager.getActiveCluster()),
                    });
                }
                break;
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
        logger.info({
            event: 'tool_success',
            tool: toolName,
            cluster: clusterForLimit,
            durationMs: Date.now() - startTime,
        });
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error({
            event: 'tool_error',
            tool: toolName,
            cluster: clusterForLimit,
            durationMs: Date.now() - startTime,
            message,
        });
        return errorContent(message);
    }
});
async function handlePaginatedScroll(args) {
    const { cursor, collection_name, cluster, ...scrollParams } = args;
    let cursorState;
    if (cursor) {
        cursorState = decodeCursor(cursor);
    }
    const resolvedCluster = cursorState?.cluster ?? cluster;
    const targetCollection = cursorState?.collection_name ?? collection_name;
    if (!targetCollection) {
        throw new Error('collection_name is required when cursor is not provided');
    }
    const request = cursorState?.request ?? {
        offset: scrollParams.offset,
        limit: scrollParams.limit,
        filter: scrollParams.filter,
        with_payload: scrollParams.with_payload,
        with_vector: scrollParams.with_vector,
    };
    // TODO: Paginated scroll doesn't support dynamic clusters yet
    // To support dynamic clusters with pagination, we would need to store cluster_url and api_key
    // in the cursor state, not just the cluster name. This would allow subsequent paginated
    // requests to continue using the same dynamic cluster credentials across page boundaries.
    return runClusterTool({ cluster: resolvedCluster }, async (client, profile) => {
        const response = await client.scrollPoints(targetCollection, request);
        const nextCursor = response.next_page_offset
            ? encodeCursor({
                cluster: profile.name,
                collection_name: targetCollection,
                request: {
                    ...request,
                    offset: response.next_page_offset,
                },
            })
            : undefined;
        return jsonContent({
            cluster: profile.name,
            collection_name: targetCollection,
            points: response.points,
            next_page_offset: response.next_page_offset,
            cursor: nextCursor,
        });
    });
}
async function describePoint(args) {
    const { collection_name, point_id } = args;
    if (!collection_name || point_id === undefined) {
        throw new Error('collection_name and point_id are required');
    }
    return runClusterTool(args, async (client, profile) => {
        const point = await client.getPoint(collection_name, point_id);
        const collectionResponse = (await client.getCollection(collection_name));
        const collectionInfo = collectionResponse.result || collectionResponse;
        let clusterInfo;
        try {
            clusterInfo = await client.getCollectionClusterInfo(collection_name);
        }
        catch {
            clusterInfo = undefined;
        }
        return jsonContent({
            cluster: profile.name,
            collection_name,
            point,
            collection: collectionInfo,
            clusterShards: clusterInfo,
        });
    });
}
function jsonContent(payload) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(payload, null, 2),
            },
        ],
    };
}
function errorContent(message) {
    return {
        content: [
            {
                type: 'text',
                text: `Error: ${message}`,
            },
        ],
        isError: true,
    };
}
async function runClusterTool(args, handler) {
    let clusterName = args.cluster;
    // Handle dynamic cluster registration
    if (args.cluster_url) {
        if (args.cluster) {
            throw new Error('Cannot specify both cluster and cluster_url parameters');
        }
        clusterName = clusterManager.registerDynamicCluster(args.cluster_url, args.cluster_api_key);
        logger.info({
            event: 'dynamic_cluster_registered',
            cluster_url: args.cluster_url,
            cluster_name: clusterName,
        });
    }
    const { client, profile } = clusterManager.getClient(clusterName);
    return handler(client, profile);
}
async function buildClusterResourcePayload(client, profile) {
    const collections = await safeCollectionsPreview(client);
    const destructiveToolsDisabled = process.env.APPROVAL_POLICY === 'never';
    return {
        cluster: sanitizeProfile(profile),
        active: profile.name === clusterManager.getActiveClusterName(),
        collections,
        rateLimit: rateLimiter.describe(),
        safety: {
            destructiveToolsDisabled,
        },
    };
}
async function safeCollectionsPreview(client) {
    try {
        const response = await client.getCollections();
        return response.collections?.map((c) => c.name) ?? [];
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn({ err: message }, 'Failed to list collections');
        return [];
    }
}
function sanitizeProfile(profile) {
    const { apiKey, ...rest } = profile;
    return {
        ...rest,
        hasApiKey: Boolean(apiKey),
    };
}
function clusterResourceUri(name) {
    return `qdrant://clusters/${name}`;
}
function encodeCursor(state) {
    return Buffer.from(JSON.stringify(state), 'utf8').toString('base64');
}
function decodeCursor(cursor) {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf8');
        return JSON.parse(decoded);
    }
    catch (error) {
        throw new Error('Invalid cursor provided');
    }
}
function parseClusterProfiles(loggerInstance) {
    const raw = process.env.QDRANT_CLUSTER_PROFILES;
    if (!raw) {
        return {
            profiles: [],
            defaultCluster: process.env.QDRANT_DEFAULT_CLUSTER,
        };
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error('QDRANT_CLUSTER_PROFILES must be a JSON array');
        }
        const profiles = parsed.map((profile) => ({
            name: profile.name,
            url: profile.url,
            apiKey: profile.apiKey ?? profile.api_key ?? '',
            description: profile.description,
            readOnly: profile.readOnly ?? profile.read_only ?? false,
            labels: profile.labels ?? profile.tags ?? [],
        }));
        return {
            profiles,
            defaultCluster: process.env.QDRANT_DEFAULT_CLUSTER,
        };
    }
    catch (error) {
        loggerInstance.warn({ err: error instanceof Error ? error.message : error }, 'Failed to parse QDRANT_CLUSTER_PROFILES; falling back to default cluster');
        return {
            profiles: [],
            defaultCluster: process.env.QDRANT_DEFAULT_CLUSTER,
        };
    }
}
async function main() {
    const port = baseConfig.PORT;
    const host = baseConfig.HOST;
    // Use HTTP transport if PORT is set, otherwise use STDIO
    if (port && port !== 3000) {
        logger.info({ port, host }, 'Starting MCP server in HTTP mode');
        // Create HTTP transport (stateless mode)
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // Stateless mode
        });
        await server.connect(transport);
        // Create HTTP server
        const httpServer = (0, http_1.createServer)(async (req, res) => {
            // Extract path after optional server slug
            const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
            const path = url.pathname;
            // Health check endpoint
            if (path === '/health' || path.endsWith('/health')) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
                return;
            }
            // MCP endpoint (supports /mcp or /server-name/mcp paths)
            if (path === '/mcp' || path.endsWith('/mcp')) {
                try {
                    await transport.handleRequest(req, res);
                }
                catch (error) {
                    logger.error({ err: error }, 'Failed to handle MCP request');
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal server error' }));
                    }
                }
                return;
            }
            // 404 for other paths
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        });
        httpServer.listen(port, host, () => {
            logger.info({
                port,
                host,
                activeCluster: clusterManager.getActiveClusterName(),
                availableClusters: clusterManager.listProfiles().map((profile) => profile.name),
                rateLimit: rateLimiter.describe(),
            }, 'Qdrant MCP server booted (HTTP mode)');
        });
    }
    else {
        // STDIO mode
        logger.info('Starting MCP server in STDIO mode');
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        logger.info({
            activeCluster: clusterManager.getActiveClusterName(),
            availableClusters: clusterManager.listProfiles().map((profile) => profile.name),
            rateLimit: rateLimiter.describe(),
        }, 'Qdrant MCP server booted (STDIO mode)');
    }
}
main().catch((error) => {
    logger.error({ err: error }, 'Failed to start MCP server');
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map