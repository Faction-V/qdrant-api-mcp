import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { QdrantClient } from '../lib/qdrant-client';
import { 
  McpRequest, 
  McpResponse, 
  McpErrorCode, 
  CreateCollectionParams,
  UpdateCollectionParams,
  DeleteCollectionParams,
  GetCollectionParams
} from '../types/mcp';
import { EnvConfig } from '../config/env';

/**
 * MCP Server class for handling MCP JSON-RPC requests
 */
export class McpServer {
  private fastify: FastifyInstance;
  private qdrantClient: QdrantClient;
  private logger: any;
  private readonly serverInfo = {
    name: 'qdrant-http-server',
    version: '1.1.0',
  };

  /**
   * Creates a new MCP Server instance
   * @param fastify Fastify instance
   * @param config Environment configuration
   */
  constructor(fastify: FastifyInstance, config: EnvConfig) {
    this.fastify = fastify;
    this.qdrantClient = new QdrantClient(config);
    this.logger = fastify.log;
    this.registerRoutes();
  }

  /**
   * Register MCP routes
   */
  private registerRoutes(): void {
    this.fastify.post('/mcp', this.handleMcpRequest.bind(this));
  }

  /**
   * Handle MCP JSON-RPC request
   * @param request Fastify request
   * @param reply Fastify reply
   */
  private async handleMcpRequest(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const mcpRequest = request.body as McpRequest;
    this.logger.info({ mcpRequest }, 'Received MCP request');

    if (!this.isValidRequest(mcpRequest)) {
      reply.code(400).send(this.createErrorResponse(
        null,
        McpErrorCode.INVALID_REQUEST,
        'Invalid JSON-RPC request'
      ));
      return;
    }

    try {
      const response = await this.processRequest(mcpRequest);
      this.logger.info({ mcpResponse: response }, 'Sending MCP response');
      reply.send(response);
    } catch (error: any) {
      this.logger.error({ error }, 'Error processing MCP request');
      reply.send(this.createErrorResponse(
        mcpRequest.id,
        McpErrorCode.INTERNAL_ERROR,
        error.message || 'Internal server error',
        error
      ));
    }
  }

  /**
   * Check if the request is a valid MCP JSON-RPC request
   * @param request MCP request
   * @returns True if valid, false otherwise
   */
  private isValidRequest(request: any): request is McpRequest {
    return (
      request &&
      request.jsonrpc === '2.0' &&
      typeof request.method === 'string' &&
      (request.id === undefined || 
       typeof request.id === 'string' || 
       typeof request.id === 'number')
    );
  }

  /**
   * Process MCP JSON-RPC request
   * @param request MCP request
   * @returns MCP response
   */
  private async processRequest(request: McpRequest): Promise<McpResponse> {
    const { method, params, id } = request;

    switch (method) {
      case 'initialize':
        return this.createSuccessResponse(id ?? null, this.initializeHandshake());
      case 'list_collections':
        return this.createSuccessResponse(id, await this.listCollections());
      case 'create_collection':
        return this.createSuccessResponse(id, await this.createCollection(params as CreateCollectionParams));
      case 'get_collection':
        return this.createSuccessResponse(id, await this.getCollection(params as GetCollectionParams));
      case 'delete_collection':
        return this.createSuccessResponse(id, await this.deleteCollection(params as DeleteCollectionParams));
      case 'update_collection':
        return this.createSuccessResponse(id, await this.updateCollection(params as UpdateCollectionParams));
      default:
        return this.createErrorResponse(
          id,
          McpErrorCode.METHOD_NOT_FOUND,
          `Method '${method}' not found`
        );
    }
  }

  /**
   * Create a success MCP JSON-RPC response
   * @param id Request ID
   * @param result Result data
   * @returns MCP response
   */
  private createSuccessResponse(id: string | number | null, result: any): McpResponse {
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
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: any
  ): McpResponse {
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
  private async listCollections(): Promise<any> {
    try {
      const response = await this.qdrantClient.getCollections();
      
      // Handle the case where collections might be undefined or not an array
      const collections = response.collections || [];
      
      return {
        collections: Array.isArray(collections)
          ? collections.map(c => c.name)
          : []
      };
    } catch (error: any) {
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
  private async createCollection(params: CreateCollectionParams): Promise<any> {
    try {
      const { collection_name, timeout, ...collectionParams } = params;
      const result = await this.qdrantClient.createCollection(
        collection_name,
        collectionParams,
        timeout
      );
      return { success: result };
    } catch (error: any) {
      this.logger.error({ error, params }, 'Error creating collection');
      throw new Error(`Failed to create collection: ${error.message}`);
    }
  }

  /**
   * Get collection details
   * @param params Get collection parameters
   * @returns Collection details
   */
  private async getCollection(params: GetCollectionParams): Promise<any> {
    try {
      const { collection_name } = params;
      return await this.qdrantClient.getCollection(collection_name);
    } catch (error: any) {
      this.logger.error({ error, params }, 'Error getting collection');
      throw new Error(`Failed to get collection: ${error.message}`);
    }
  }

  /**
   * Delete a collection
   * @param params Delete collection parameters
   * @returns Success status
   */
  private async deleteCollection(params: DeleteCollectionParams): Promise<any> {
    try {
      const { collection_name, timeout } = params;
      const result = await this.qdrantClient.deleteCollection(
        collection_name,
        timeout
      );
      return { success: result };
    } catch (error: any) {
      this.logger.error({ error, params }, 'Error deleting collection');
      throw new Error(`Failed to delete collection: ${error.message}`);
    }
  }

  /**
   * Update collection parameters
   * @param params Update collection parameters
   * @returns Success status
   */
  private async updateCollection(params: UpdateCollectionParams): Promise<any> {
    try {
      const { collection_name, timeout, ...updateParams } = params;
      const result = await this.qdrantClient.updateCollection(
        collection_name,
        updateParams,
        timeout
      );
      return { success: result };
    } catch (error: any) {
      this.logger.error({ error, params }, 'Error updating collection');
      throw new Error(`Failed to update collection: ${error.message}`);
    }
  }

  private initializeHandshake() {
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
