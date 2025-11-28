"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServer = void 0;
const qdrant_client_1 = require("../lib/qdrant-client");
const mcp_1 = require("../types/mcp");
/**
 * MCP Server class for handling MCP JSON-RPC requests
 */
class McpServer {
    /**
     * Creates a new MCP Server instance
     * @param fastify Fastify instance
     * @param config Environment configuration
     */
    constructor(fastify, config) {
        this.serverInfo = {
            name: 'qdrant-http-server',
            version: '1.1.0',
        };
        this.fastify = fastify;
        this.qdrantClient = new qdrant_client_1.QdrantClient(config);
        this.logger = fastify.log;
        this.registerRoutes();
    }
    /**
     * Register MCP routes
     */
    registerRoutes() {
        this.fastify.post('/mcp', this.handleMcpRequest.bind(this));
    }
    /**
     * Handle MCP JSON-RPC request
     * @param request Fastify request
     * @param reply Fastify reply
     */
    async handleMcpRequest(request, reply) {
        const mcpRequest = request.body;
        this.logger.info({ mcpRequest }, 'Received MCP request');
        if (!this.isValidRequest(mcpRequest)) {
            reply.code(400).send(this.createErrorResponse(null, mcp_1.McpErrorCode.INVALID_REQUEST, 'Invalid JSON-RPC request'));
            return;
        }
        try {
            const response = await this.processRequest(mcpRequest);
            this.logger.info({ mcpResponse: response }, 'Sending MCP response');
            reply.send(response);
        }
        catch (error) {
            this.logger.error({ error }, 'Error processing MCP request');
            reply.send(this.createErrorResponse(mcpRequest.id, mcp_1.McpErrorCode.INTERNAL_ERROR, error.message || 'Internal server error', error));
        }
    }
    /**
     * Check if the request is a valid MCP JSON-RPC request
     * @param request MCP request
     * @returns True if valid, false otherwise
     */
    isValidRequest(request) {
        return (request &&
            request.jsonrpc === '2.0' &&
            typeof request.method === 'string' &&
            (request.id === undefined ||
                typeof request.id === 'string' ||
                typeof request.id === 'number'));
    }
    /**
     * Process MCP JSON-RPC request
     * @param request MCP request
     * @returns MCP response
     */
    async processRequest(request) {
        const { method, params, id } = request;
        switch (method) {
            case 'initialize':
                return this.createSuccessResponse(id ?? null, this.initializeHandshake());
            case 'list_collections':
                return this.createSuccessResponse(id, await this.listCollections());
            case 'create_collection':
                return this.createSuccessResponse(id, await this.createCollection(params));
            case 'get_collection':
                return this.createSuccessResponse(id, await this.getCollection(params));
            case 'delete_collection':
                return this.createSuccessResponse(id, await this.deleteCollection(params));
            case 'update_collection':
                return this.createSuccessResponse(id, await this.updateCollection(params));
            default:
                return this.createErrorResponse(id, mcp_1.McpErrorCode.METHOD_NOT_FOUND, `Method '${method}' not found`);
        }
    }
    /**
     * Create a success MCP JSON-RPC response
     * @param id Request ID
     * @param result Result data
     * @returns MCP response
     */
    createSuccessResponse(id, result) {
        return {
            jsonrpc: '2.0',
            id,
            result
        };
    }
    /**
     * Create an error MCP JSON-RPC response
     * @param id Request ID
     * @param code Error code
     * @param message Error message
     * @param data Additional error data
     * @returns MCP error response
     */
    createErrorResponse(id, code, message, data) {
        return {
            jsonrpc: '2.0',
            id: id || null,
            error: {
                code,
                message,
                data
            }
        };
    }
    /**
     * List all collections
     * @returns Collections list
     */
    async listCollections() {
        try {
            const response = await this.qdrantClient.getCollections();
            // Handle the case where collections might be undefined or not an array
            const collections = response.collections || [];
            return {
                collections: Array.isArray(collections)
                    ? collections.map(c => c.name)
                    : []
            };
        }
        catch (error) {
            this.logger.error({ error }, 'Error listing collections');
            // Return empty collections array instead of throwing
            return {
                collections: []
            };
        }
    }
    /**
     * Create a new collection
     * @param params Create collection parameters
     * @returns Success status
     */
    async createCollection(params) {
        try {
            const { collection_name, timeout, ...collectionParams } = params;
            const result = await this.qdrantClient.createCollection(collection_name, collectionParams, timeout);
            return { success: result };
        }
        catch (error) {
            this.logger.error({ error, params }, 'Error creating collection');
            throw new Error(`Failed to create collection: ${error.message}`);
        }
    }
    /**
     * Get collection details
     * @param params Get collection parameters
     * @returns Collection details
     */
    async getCollection(params) {
        try {
            const { collection_name } = params;
            return await this.qdrantClient.getCollection(collection_name);
        }
        catch (error) {
            this.logger.error({ error, params }, 'Error getting collection');
            throw new Error(`Failed to get collection: ${error.message}`);
        }
    }
    /**
     * Delete a collection
     * @param params Delete collection parameters
     * @returns Success status
     */
    async deleteCollection(params) {
        try {
            const { collection_name, timeout } = params;
            const result = await this.qdrantClient.deleteCollection(collection_name, timeout);
            return { success: result };
        }
        catch (error) {
            this.logger.error({ error, params }, 'Error deleting collection');
            throw new Error(`Failed to delete collection: ${error.message}`);
        }
    }
    /**
     * Update collection parameters
     * @param params Update collection parameters
     * @returns Success status
     */
    async updateCollection(params) {
        try {
            const { collection_name, timeout, ...updateParams } = params;
            const result = await this.qdrantClient.updateCollection(collection_name, updateParams, timeout);
            return { success: result };
        }
        catch (error) {
            this.logger.error({ error, params }, 'Error updating collection');
            throw new Error(`Failed to update collection: ${error.message}`);
        }
    }
    initializeHandshake() {
        return {
            serverInfo: this.serverInfo,
            capabilities: {
                tools: {},
                resources: {},
            },
            metadata: {
                transport: 'http',
                health: '/health',
            },
        };
    }
}
exports.McpServer = McpServer;
//# sourceMappingURL=server.js.map