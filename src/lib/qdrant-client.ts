import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EnvConfig } from '../config/env';

/**
 * Interface for collection information
 */
export interface CollectionInfo {
  name: string;
  status: string;
  vectors_count: number;
  points_count: number;
  segments_count: number;
  config: CollectionConfig;
  payload_schema?: Record<string, PayloadSchemaType>;
}

/**
 * Interface for collection configuration
 */
export interface CollectionConfig {
  params: CollectionParams;
  hnsw_config?: HnswConfig;
  optimizer_config?: OptimizerConfig;
  wal_config?: WalConfig;
  quantization_config?: QuantizationConfig;
}

/**
 * Interface for collection parameters
 */
export interface CollectionParams {
  vectors: VectorsConfig;
  shard_number?: number;
  replication_factor?: number;
  write_consistency_factor?: number;
  on_disk_payload?: boolean;
}

/**
 * Interface for vectors configuration
 */
export interface VectorsConfig {
  size: number;
  distance: string;
}

/**
 * Interface for HNSW configuration
 */
export interface HnswConfig {
  m: number;
  ef_construct: number;
  full_scan_threshold?: number;
  max_indexing_threads?: number;
  on_disk?: boolean;
  payload_m?: number;
}

/**
 * Interface for optimizer configuration
 */
export interface OptimizerConfig {
  deleted_threshold: number;
  vacuum_min_vector_number: number;
  default_segment_number: number;
  max_segment_size: number;
  memmap_threshold: number;
  indexing_threshold: number;
  flush_interval_sec: number;
  max_optimization_threads: number;
}

/**
 * Interface for WAL configuration
 */
export interface WalConfig {
  wal_capacity_mb: number;
  wal_segments_ahead: number;
}

/**
 * Interface for quantization configuration
 */
export interface QuantizationConfig {
  scalar?: ScalarQuantization;
  product?: ProductQuantization;
  binary?: BinaryQuantization;
}

/**
 * Interface for scalar quantization
 */
export interface ScalarQuantization {
  type: string;
  quantile?: number;
  always_ram?: boolean;
}

/**
 * Interface for product quantization
 */
export interface ProductQuantization {
  compression: string;
  always_ram?: boolean;
}

/**
 * Interface for binary quantization
 */
export interface BinaryQuantization {
  always_ram?: boolean;
}

/**
 * Interface for payload schema type
 */
export interface PayloadSchemaType {
  data_type: string;
  points?: number;
  indexes?: Record<string, PayloadIndexParams>;
}

/**
 * Interface for payload index parameters
 */
export interface PayloadIndexParams {
  type: string;
  options?: Record<string, unknown>;
}

/**
 * Interface for collections response
 */
export interface CollectionsResponse {
  collections: CollectionDescription[];
  time: number;
}

/**
 * Interface for collection description
 */
export interface CollectionDescription {
  name: string;
}

/**
 * Interface for collection existence response
 */
export interface CollectionExistence {
  exists: boolean;
}

/**
 * Interface for update result
 */
export interface UpdateResult {
  operation_id: number;
  status: string;
  time: number;
}

/**
 * Interface for collection cluster info
 */
export interface CollectionClusterInfo {
  peer_id: number;
  shard_count: number;
  local_shards: ShardInfo[];
  remote_shards: ShardInfo[];
  shard_transfers: ShardTransferInfo[];
}

/**
 * Interface for shard info
 */
export interface ShardInfo {
  shard_id: number;
  points_count: number;
  state: string;
}

/**
 * Interface for shard transfer info
 */
export interface ShardTransferInfo {
  shard_id: number;
  from: number;
  to: number;
  sync: boolean;
}

/**
 * Interface for collections aliases response
 */
export interface CollectionsAliasesResponse {
  aliases: AliasDescription[];
  time: number;
}

/**
 * Interface for alias description
 */
export interface AliasDescription {
  alias_name: string;
  collection_name: string;
}

/**
 * Interface for create collection request
 */
export interface CreateCollectionRequest {
  vectors: VectorsConfig;
  shard_number?: number;
  replication_factor?: number;
  write_consistency_factor?: number;
  on_disk_payload?: boolean;
  hnsw_config?: HnswConfig;
  wal_config?: WalConfig;
  optimizers_config?: OptimizerConfig;
  init_from?: InitFrom;
  quantization_config?: QuantizationConfig;
}

/**
 * Interface for init from configuration
 */
export interface InitFrom {
  collection: string;
}

/**
 * Interface for update collection request
 */
export interface UpdateCollectionRequest {
  optimizers_config?: OptimizerConfig;
  params?: CollectionParams;
}

/**
 * Interface for create field index request
 */
export interface CreateFieldIndexRequest {
  field_name: string;
  field_schema?: PayloadSchemaType;
}

/**
 * Interface for cluster operations
 */
export interface ClusterOperations {
  move_shard?: MoveShardOperation;
  replicate_shard?: ReplicateShardOperation;
  abort_transfer?: AbortTransferOperation;
  drop_replica?: DropReplicaOperation;
}

/**
 * Interface for move shard operation
 */
export interface MoveShardOperation {
  shard_id: number;
  from_peer_id: number;
  to_peer_id: number;
  method?: string;
}

/**
 * Interface for replicate shard operation
 */
export interface ReplicateShardOperation {
  shard_id: number;
  from_peer_id: number;
  to_peer_id: number;
  method?: string;
}

/**
 * Interface for abort transfer operation
 */
export interface AbortTransferOperation {
  shard_id: number;
  from_peer_id: number;
  to_peer_id: number;
}

/**
 * Interface for drop replica operation
 */
export interface DropReplicaOperation {
  shard_id: number;
  peer_id: number;
}

/**
 * Interface for write ordering
 */
export interface WriteOrdering {
  type: string;
}

/**
 * Qdrant client for interacting with the Qdrant Collections API
 */
export class QdrantClient {
  private client: AxiosInstance;

  /**
   * Creates a new QdrantClient instance
   * @param config Environment configuration
   */
  constructor(config: EnvConfig) {
    const axiosConfig: AxiosRequestConfig = {
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

    this.client = axios.create(axiosConfig);
  }

  /**
   * Get list of all collections
   * @returns Promise with collections response
   */
  async getCollections(): Promise<CollectionsResponse> {
    const response = await this.client.get('/collections');
    return response.data;
  }

  /**
   * Get detailed information about a collection
   * @param collectionName Name of the collection
   * @returns Promise with collection info
   */
  async getCollection(collectionName: string): Promise<CollectionInfo> {
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
  async createCollection(
    collectionName: string,
    request: CreateCollectionRequest,
    timeout?: number
  ): Promise<boolean> {
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
  async updateCollection(
    collectionName: string,
    request: UpdateCollectionRequest,
    timeout?: number
  ): Promise<boolean> {
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
  async deleteCollection(
    collectionName: string,
    timeout?: number
  ): Promise<boolean> {
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
  async collectionExists(collectionName: string): Promise<CollectionExistence> {
    const response = await this.client.get(`/collections/${collectionName}/exists`);
    return response.data;
  }
}