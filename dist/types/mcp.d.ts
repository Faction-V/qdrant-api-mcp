/**
 * MCP JSON-RPC request interface
 */
export interface McpRequest {
    jsonrpc: string;
    id: string | number;
    method: string;
    params?: any;
}
/**
 * MCP JSON-RPC response interface
 */
export interface McpResponse {
    jsonrpc: string;
    id: string | number | null;
    result?: any;
    error?: McpError;
}
/**
 * MCP JSON-RPC error interface
 */
export interface McpError {
    code: number;
    message: string;
    data?: any;
}
/**
 * MCP error codes
 */
export declare enum McpErrorCode {
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603,
    SERVER_ERROR_START = -32000,
    SERVER_ERROR_END = -32099,
    QDRANT_ERROR = -32050
}
/**
 * Collection parameters for create_collection method
 */
export interface CreateCollectionParams {
    collection_name: string;
    vectors: {
        size: number;
        distance: string;
    };
    shard_number?: number;
    replication_factor?: number;
    write_consistency_factor?: number;
    on_disk_payload?: boolean;
    hnsw_config?: {
        m: number;
        ef_construct: number;
        full_scan_threshold?: number;
        max_indexing_threads?: number;
        on_disk?: boolean;
        payload_m?: number;
    };
    timeout?: number;
}
/**
 * Collection parameters for update_collection method
 */
export interface UpdateCollectionParams {
    collection_name: string;
    optimizers_config?: {
        deleted_threshold: number;
        vacuum_min_vector_number: number;
        default_segment_number: number;
        max_segment_size: number;
        memmap_threshold: number;
        indexing_threshold: number;
        flush_interval_sec: number;
        max_optimization_threads: number;
    };
    params?: {
        vectors: {
            size: number;
            distance: string;
        };
        shard_number?: number;
        replication_factor?: number;
        write_consistency_factor?: number;
        on_disk_payload?: boolean;
    };
    timeout?: number;
}
/**
 * Collection parameters for delete_collection method
 */
export interface DeleteCollectionParams {
    collection_name: string;
    timeout?: number;
}
/**
 * Collection parameters for get_collection method
 */
export interface GetCollectionParams {
    collection_name: string;
}
