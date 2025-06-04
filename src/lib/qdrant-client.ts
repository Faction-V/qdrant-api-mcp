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
  payload_schema?: { [key: string]: PayloadSchemaType };
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
  indexes?: { [key: string]: PayloadIndexParams };
}

/**
 * Interface for payload index parameters
 */
export interface PayloadIndexParams {
  type: string;
  options?: { [key: string]: unknown };
}

/**
 * Interface for collections response
 */
export interface CollectionsResponse {
  collections: CollectionDescription[];
  time: number;
}

/**
 * Interface for Qdrant API response wrapper
 */
export interface QdrantApiResponse<T> {
  result: T;
  status: string;
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
 * Interface for point ID (can be string or number)
 */
export type PointId = string | number;

/**
 * Interface for vector data
 */
export interface Vector {
  [key: string]: number[] | { [key: string]: number[] };
}

/**
 * Interface for point payload
 */
export interface Payload {
  [key: string]: any;
}

/**
 * Interface for a point record
 */
export interface PointRecord {
  id: PointId;
  payload?: Payload;
  vector?: Vector;
}

/**
 * Interface for scored point (search result)
 */
export interface ScoredPoint {
  id: PointId;
  version: number;
  score: number;
  payload?: Payload;
  vector?: Vector;
}

/**
 * Interface for point insert operations
 */
export interface PointInsertOperations {
  points: PointRecord[];
}

/**
 * Interface for search request
 */
export interface SearchRequest {
  vector: number[];
  limit?: number;
  offset?: number;
  filter?: Filter;
  params?: SearchParams;
  score_threshold?: number;
  with_payload?: boolean | string[];
  with_vector?: boolean | string[];
}

/**
 * Interface for search parameters
 */
export interface SearchParams {
  hnsw_ef?: number;
  exact?: boolean;
}

/**
 * Interface for filter conditions
 */
export interface Filter {
  should?: Condition[];
  must?: Condition[];
  must_not?: Condition[];
}

/**
 * Interface for filter condition
 */
export interface Condition {
  key?: string;
  match?: MatchCondition;
  range?: RangeCondition;
  geo_bounding_box?: GeoBoundingBoxCondition;
  geo_radius?: GeoRadiusCondition;
  values_count?: ValuesCountCondition;
}

/**
 * Interface for match condition
 */
export interface MatchCondition {
  value?: any;
  text?: string;
  any?: any[];
  except?: any[];
}

/**
 * Interface for range condition
 */
export interface RangeCondition {
  lt?: number;
  gt?: number;
  gte?: number;
  lte?: number;
}

/**
 * Interface for geo bounding box condition
 */
export interface GeoBoundingBoxCondition {
  top_left: GeoPoint;
  bottom_right: GeoPoint;
}

/**
 * Interface for geo radius condition
 */
export interface GeoRadiusCondition {
  center: GeoPoint;
  radius: number;
}

/**
 * Interface for geo point
 */
export interface GeoPoint {
  lon: number;
  lat: number;
}

/**
 * Interface for values count condition
 */
export interface ValuesCountCondition {
  lt?: number;
  gt?: number;
  gte?: number;
  lte?: number;
}

/**
 * Interface for scroll request
 */
export interface ScrollRequest {
  offset?: PointId;
  limit?: number;
  filter?: Filter;
  with_payload?: boolean | string[];
  with_vector?: boolean | string[];
}

/**
 * Interface for scroll result
 */
export interface ScrollResult {
  points: PointRecord[];
  next_page_offset?: PointId;
}

/**
 * Interface for count request
 */
export interface CountRequest {
  filter?: Filter;
  exact?: boolean;
}

/**
 * Interface for count result
 */
export interface CountResult {
  count: number;
}

/**
 * Interface for recommend request
 */
export interface RecommendRequest {
  positive: PointId[];
  negative?: PointId[];
  limit?: number;
  offset?: number;
  filter?: Filter;
  params?: SearchParams;
  score_threshold?: number;
  with_payload?: boolean | string[];
  with_vector?: boolean | string[];
}

/**
 * Interface for points selector
 */
export interface PointsSelector {
  points?: PointId[];
  filter?: Filter;
}

/**
 * Interface for set payload request
 */
export interface SetPayloadRequest {
  payload: Payload;
  points?: PointId[];
  filter?: Filter;
}

/**
 * Interface for delete payload request
 */
export interface DeletePayloadRequest {
  keys: string[];
  points?: PointId[];
  filter?: Filter;
}

/**
 * Qdrant client for interacting with the Qdrant Collections and Points API
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
    try {
      const response = await this.client.get<QdrantApiResponse<CollectionsResponse>>('/collections');
      return response.data.result;
    } catch (error: any) {
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

  // Points operations

  /**
   * Upsert points into a collection
   * @param collectionName Name of the collection
   * @param request Point insert operations
   * @param wait If true, wait for changes to actually happen
   * @param ordering Define ordering guarantees for the operation
   * @returns Promise with update result
   */
  async upsertPoints(
    collectionName: string,
    request: PointInsertOperations,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.put<QdrantApiResponse<UpdateResult>>(url, request);
    return response.data.result;
  }

  /**
   * Search for points in a collection
   * @param collectionName Name of the collection
   * @param request Search request
   * @returns Promise with array of scored points
   */
  async searchPoints(
    collectionName: string,
    request: SearchRequest
  ): Promise<ScoredPoint[]> {
    const response = await this.client.post<QdrantApiResponse<ScoredPoint[]>>(
      `/collections/${collectionName}/points/search`,
      request
    );
    return response.data.result;
  }

  /**
   * Scroll through points in a collection
   * @param collectionName Name of the collection
   * @param request Scroll request
   * @returns Promise with scroll result
   */
  async scrollPoints(
    collectionName: string,
    request: ScrollRequest
  ): Promise<ScrollResult> {
    const response = await this.client.post<QdrantApiResponse<ScrollResult>>(
      `/collections/${collectionName}/points/scroll`,
      request
    );
    return response.data.result;
  }

  /**
   * Count points in a collection
   * @param collectionName Name of the collection
   * @param request Count request
   * @returns Promise with count result
   */
  async countPoints(
    collectionName: string,
    request: CountRequest
  ): Promise<CountResult> {
    const response = await this.client.post<QdrantApiResponse<CountResult>>(
      `/collections/${collectionName}/points/count`,
      request
    );
    return response.data.result;
  }

  /**
   * Get recommendations for points
   * @param collectionName Name of the collection
   * @param request Recommend request
   * @returns Promise with array of scored points
   */
  async recommendPoints(
    collectionName: string,
    request: RecommendRequest
  ): Promise<ScoredPoint[]> {
    const response = await this.client.post<QdrantApiResponse<ScoredPoint[]>>(
      `/collections/${collectionName}/points/recommend`,
      request
    );
    return response.data.result;
  }

  /**
   * Get a single point by ID
   * @param collectionName Name of the collection
   * @param pointId ID of the point
   * @returns Promise with point record
   */
  async getPoint(
    collectionName: string,
    pointId: PointId
  ): Promise<PointRecord> {
    const response = await this.client.get<QdrantApiResponse<PointRecord>>(
      `/collections/${collectionName}/points/${pointId}`
    );
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
  async deletePoint(
    collectionName: string,
    pointId: PointId,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points/${pointId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.delete<QdrantApiResponse<UpdateResult>>(url);
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
  async deletePoints(
    collectionName: string,
    request: PointsSelector,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points/delete${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.post<QdrantApiResponse<UpdateResult>>(url, request);
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
  async setPayload(
    collectionName: string,
    request: SetPayloadRequest,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points/payload${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.post<QdrantApiResponse<UpdateResult>>(url, request);
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
  async overwritePayload(
    collectionName: string,
    request: SetPayloadRequest,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points/payload${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.put<QdrantApiResponse<UpdateResult>>(url, request);
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
  async deletePayload(
    collectionName: string,
    request: DeletePayloadRequest,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points/payload/delete${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.post<QdrantApiResponse<UpdateResult>>(url, request);
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
  async clearPayload(
    collectionName: string,
    request: PointsSelector,
    wait?: boolean,
    ordering?: WriteOrdering
  ): Promise<UpdateResult> {
    const params = new URLSearchParams();
    if (wait !== undefined) params.append('wait', wait.toString());
    if (ordering) params.append('ordering', JSON.stringify(ordering));
    
    const url = `/collections/${collectionName}/points/payload/clear${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.post<QdrantApiResponse<UpdateResult>>(url, request);
    return response.data.result;
  }
}