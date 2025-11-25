"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Qdrant client for interacting with the Qdrant Collections and Points API
 */
class QdrantClient {
    /**
     * Creates a new QdrantClient instance
     * @param config Environment configuration
     */
    constructor(config) {
        const axiosConfig = {
            baseURL: config.QDRANT_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (config.QDRANT_API_KEY) {
            axiosConfig.headers = {
                ...axiosConfig.headers,
                'api-key': config.QDRANT_API_KEY,
            };
        }
        this.client = axios_1.default.create(axiosConfig);
    }
    /**
     * Get list of all collections
     * @returns Promise with collections response
     */
    async getCollections() {
        try {
            const response = await this.client.get('/collections');
            return response.data.result;
        }
        catch (error) {
            // Return a default response if the API call fails
            return {
                collections: [],
                time: 0
            };
        }
    }
    /**
     * Get detailed information about a collection
     * @param collectionName Name of the collection
     * @returns Promise with collection info
     */
    async getCollection(collectionName) {
        const response = await this.client.get(`/collections/${collectionName}`);
        return response.data;
    }
    /**
     * Create a new collection
     * @param collectionName Name of the collection
     * @param request Create collection request
     * @param timeout Optional timeout in seconds
     * @returns Promise with boolean result
     */
    async createCollection(collectionName, request, timeout) {
        const url = timeout
            ? `/collections/${collectionName}?timeout=${timeout}`
            : `/collections/${collectionName}`;
        const response = await this.client.put(url, request);
        return response.data;
    }
    /**
     * Update collection parameters
     * @param collectionName Name of the collection
     * @param request Update collection request
     * @param timeout Optional timeout in seconds
     * @returns Promise with boolean result
     */
    async updateCollection(collectionName, request, timeout) {
        const url = timeout
            ? `/collections/${collectionName}?timeout=${timeout}`
            : `/collections/${collectionName}`;
        const response = await this.client.patch(url, request);
        return response.data;
    }
    /**
     * Delete a collection
     * @param collectionName Name of the collection
     * @param timeout Optional timeout in seconds
     * @returns Promise with boolean result
     */
    async deleteCollection(collectionName, timeout) {
        const url = timeout
            ? `/collections/${collectionName}?timeout=${timeout}`
            : `/collections/${collectionName}`;
        const response = await this.client.delete(url);
        return response.data;
    }
    /**
     * Check if a collection exists
     * @param collectionName Name of the collection
     * @returns Promise with collection existence
     */
    async collectionExists(collectionName) {
        const response = await this.client.get(`/collections/${collectionName}/exists`);
        return response.data;
    }
    /**
     * Get cluster/shard information for a collection
     * @param collectionName Name of the collection
     * @returns Promise with cluster info
     */
    async getCollectionClusterInfo(collectionName) {
        const response = await this.client.get(`/collections/${collectionName}/cluster`);
        return response.data.result;
    }
    // Points operations
    /**
     * Upsert points into a collection
     * @param collectionName Name of the collection
     * @param request Point insert operations
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async upsertPoints(collectionName, request, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.put(url, request);
        return response.data.result;
    }
    /**
     * Search for points in a collection
     * @param collectionName Name of the collection
     * @param request Search request
     * @returns Promise with array of scored points
     */
    async searchPoints(collectionName, request) {
        const response = await this.client.post(`/collections/${collectionName}/points/search`, request);
        return response.data.result;
    }
    /**
     * Scroll through points in a collection
     * @param collectionName Name of the collection
     * @param request Scroll request
     * @returns Promise with scroll result
     */
    async scrollPoints(collectionName, request) {
        const response = await this.client.post(`/collections/${collectionName}/points/scroll`, request);
        return response.data.result;
    }
    /**
     * Count points in a collection
     * @param collectionName Name of the collection
     * @param request Count request
     * @returns Promise with count result
     */
    async countPoints(collectionName, request) {
        const response = await this.client.post(`/collections/${collectionName}/points/count`, request);
        return response.data.result;
    }
    /**
     * Get recommendations for points
     * @param collectionName Name of the collection
     * @param request Recommend request
     * @returns Promise with array of scored points
     */
    async recommendPoints(collectionName, request) {
        const response = await this.client.post(`/collections/${collectionName}/points/recommend`, request);
        return response.data.result;
    }
    /**
     * Get a single point by ID
     * @param collectionName Name of the collection
     * @param pointId ID of the point
     * @returns Promise with point record
     */
    async getPoint(collectionName, pointId) {
        const response = await this.client.get(`/collections/${collectionName}/points/${pointId}`);
        return response.data.result;
    }
    /**
     * Delete a single point by ID
     * @param collectionName Name of the collection
     * @param pointId ID of the point to delete
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async deletePoint(collectionName, pointId, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points/${pointId}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.delete(url);
        return response.data.result;
    }
    /**
     * Delete multiple points by filter or IDs
     * @param collectionName Name of the collection
     * @param request Points selector (filter or IDs)
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async deletePoints(collectionName, request, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points/delete${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.post(url, request);
        return response.data.result;
    }
    /**
     * Set payload for points
     * @param collectionName Name of the collection
     * @param request Set payload request
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async setPayload(collectionName, request, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points/payload${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.post(url, request);
        return response.data.result;
    }
    /**
     * Overwrite payload for points
     * @param collectionName Name of the collection
     * @param request Set payload request
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async overwritePayload(collectionName, request, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points/payload${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.put(url, request);
        return response.data.result;
    }
    /**
     * Delete payload keys from points
     * @param collectionName Name of the collection
     * @param request Delete payload request
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async deletePayload(collectionName, request, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points/payload/delete${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.post(url, request);
        return response.data.result;
    }
    /**
     * Clear all payload from points
     * @param collectionName Name of the collection
     * @param request Points selector (filter or IDs)
     * @param wait If true, wait for changes to actually happen
     * @param ordering Define ordering guarantees for the operation
     * @returns Promise with update result
     */
    async clearPayload(collectionName, request, wait, ordering) {
        const params = new URLSearchParams();
        if (wait !== undefined)
            params.append('wait', wait.toString());
        if (ordering)
            params.append('ordering', JSON.stringify(ordering));
        const url = `/collections/${collectionName}/points/payload/clear${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.client.post(url, request);
        return response.data.result;
    }
}
exports.QdrantClient = QdrantClient;
//# sourceMappingURL=qdrant-client.js.map