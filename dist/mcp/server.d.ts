import { FastifyInstance } from 'fastify';
import { EnvConfig } from '../config/env';
/**
 * MCP Server class for handling MCP JSON-RPC requests
 */
export declare class McpServer {
    private fastify;
    private qdrantClient;
    private logger;
    private readonly serverInfo;
    /**
     * Creates a new MCP Server instance
     * @param fastify Fastify instance
     * @param config Environment configuration
     */
    constructor(fastify: FastifyInstance, config: EnvConfig);
    /**
     * Register MCP routes
     */
    private registerRoutes;
    /**
     * Handle MCP JSON-RPC request
     * @param request Fastify request
     * @param reply Fastify reply
     */
    private handleMcpRequest;
    /**
     * Check if the request is a valid MCP JSON-RPC request
     * @param request MCP request
     * @returns True if valid, false otherwise
     */
    private isValidRequest;
    /**
     * Process MCP JSON-RPC request
     * @param request MCP request
     * @returns MCP response
     */
    private processRequest;
    /**
     * Create a success MCP JSON-RPC response
     * @param id Request ID
     * @param result Result data
     * @returns MCP response
     */
    private createSuccessResponse;
    /**
     * Create an error MCP JSON-RPC response
     * @param id Request ID
     * @param code Error code
     * @param message Error message
     * @param data Additional error data
     * @returns MCP error response
     */
    private createErrorResponse;
    /**
     * List all collections
     * @returns Collections list
     */
    private listCollections;
    /**
     * Create a new collection
     * @param params Create collection parameters
     * @returns Success status
     */
    private createCollection;
    /**
     * Get collection details
     * @param params Get collection parameters
     * @returns Collection details
     */
    private getCollection;
    /**
     * Delete a collection
     * @param params Delete collection parameters
     * @returns Success status
     */
    private deleteCollection;
    /**
     * Update collection parameters
     * @param params Update collection parameters
     * @returns Success status
     */
    private updateCollection;
    private initializeHandshake;
}
