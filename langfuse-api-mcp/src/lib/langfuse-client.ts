import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { EnvConfig } from '../config/env.js';

// Core interfaces based on Langfuse OpenAPI spec
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AnnotationQueue {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationQueueItem {
  id: string;
  queueId: string;
  objectId: string;
  objectType: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  objectId: string;
  objectType: 'trace' | 'observation' | 'session' | 'prompt';
  authorUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetItem {
  id: string;
  datasetId: string;
  datasetName: string;
  input?: any;
  expectedOutput?: any;
  metadata?: any;
  sourceTraceId?: string;
  sourceObservationId?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  metadata?: any;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trace {
  id: string;
  name?: string;
  userId?: string;
  sessionId?: string;
  version?: string;
  release?: string;
  externalId?: string;
  metadata?: any;
  tags?: string[];
  input?: any;
  output?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Observation {
  id: string;
  traceId: string;
  type: 'GENERATION' | 'SPAN' | 'EVENT';
  name?: string;
  startTime?: string;
  endTime?: string;
  completionStartTime?: string;
  model?: string;
  modelParameters?: any;
  input?: any;
  output?: any;
  metadata?: any;
  level: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
  statusMessage?: string;
  parentObservationId?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface Score {
  id: string;
  name: string;
  value: number;
  traceId: string;
  observationId?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Model {
  id: string;
  modelName: string;
  matchPattern: string;
  startDate?: string;
  inputPrice?: number;
  outputPrice?: number;
  totalPrice?: number;
  unit: 'TOKENS' | 'CHARACTERS' | 'REQUESTS' | 'SECONDS';
  tokenizerId?: string;
  tokenizerConfig?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Projects {
  projects: Project[];
}

// Request/Response interfaces
export interface CreateAnnotationQueueItemRequest {
  objectId: string;
  objectType: string;
}

export interface UpdateAnnotationQueueItemRequest {
  status?: 'PENDING' | 'COMPLETED' | 'SKIPPED';
}

export interface CreateCommentRequest {
  content: string;
  objectId: string;
  objectType: 'trace' | 'observation' | 'session' | 'prompt';
}

export interface CreateDatasetItemRequest {
  datasetName: string;
  input?: any;
  expectedOutput?: any;
  metadata?: any;
  sourceTraceId?: string;
  sourceObservationId?: string;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
  metadata?: any;
}

export interface CreateModelRequest {
  modelName: string;
  matchPattern: string;
  startDate?: string;
  inputPrice?: number;
  outputPrice?: number;
  totalPrice?: number;
  unit: 'TOKENS' | 'CHARACTERS' | 'REQUESTS' | 'SECONDS';
  tokenizerId?: string;
  tokenizerConfig?: any;
}

export interface CreateScoreRequest {
  name: string;
  value: number;
  traceId: string;
  observationId?: string;
  comment?: string;
}

// Paginated response interfaces
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type PaginatedAnnotationQueues = PaginatedResponse<AnnotationQueue>;
export type PaginatedAnnotationQueueItems = PaginatedResponse<AnnotationQueueItem>;
export type PaginatedDatasetItems = PaginatedResponse<DatasetItem>;
export type PaginatedDatasets = PaginatedResponse<Dataset>;
export type PaginatedTraces = PaginatedResponse<Trace>;
export type PaginatedObservations = PaginatedResponse<Observation>;
export type PaginatedSessions = PaginatedResponse<Session>;
export type PaginatedScores = PaginatedResponse<Score>;
export type PaginatedModels = PaginatedResponse<Model>;

export class LangfuseClient {
  private client: AxiosInstance;
  private config: EnvConfig;

  constructor(config: EnvConfig) {
    this.config = config;
    
    // Create axios instance with basic auth
    this.client = axios.create({
      baseURL: config.LANGFUSE_BASE_URL,
      auth: {
        username: config.LANGFUSE_PUBLIC_KEY,
        password: config.LANGFUSE_SECRET_KEY,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/api/public/health');
    return response.data;
  }

  // Annotation Queues
  async listAnnotationQueues(params?: PaginationParams): Promise<PaginatedAnnotationQueues> {
    const response = await this.client.get('/api/public/annotation-queues', { params });
    return response.data;
  }

  async getAnnotationQueue(queueId: string): Promise<AnnotationQueue> {
    const response = await this.client.get(`/api/public/annotation-queues/${queueId}`);
    return response.data;
  }

  async listAnnotationQueueItems(
    queueId: string,
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedAnnotationQueueItems> {
    const response = await this.client.get(`/api/public/annotation-queues/${queueId}/items`, { params });
    return response.data;
  }

  async createAnnotationQueueItem(
    queueId: string,
    data: CreateAnnotationQueueItemRequest
  ): Promise<AnnotationQueueItem> {
    const response = await this.client.post(`/api/public/annotation-queues/${queueId}/items`, data);
    return response.data;
  }

  async getAnnotationQueueItem(queueId: string, itemId: string): Promise<AnnotationQueueItem> {
    const response = await this.client.get(`/api/public/annotation-queues/${queueId}/items/${itemId}`);
    return response.data;
  }

  async updateAnnotationQueueItem(
    queueId: string,
    itemId: string,
    data: UpdateAnnotationQueueItemRequest
  ): Promise<AnnotationQueueItem> {
    const response = await this.client.patch(`/api/public/annotation-queues/${queueId}/items/${itemId}`, data);
    return response.data;
  }

  async deleteAnnotationQueueItem(queueId: string, itemId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/public/annotation-queues/${queueId}/items/${itemId}`);
    return response.data;
  }

  // Comments
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await this.client.post('/api/public/comments', data);
    return response.data;
  }

  async getComments(params?: PaginationParams & {
    objectType?: string;
    objectId?: string;
    authorUserId?: string;
  }): Promise<PaginatedResponse<Comment>> {
    const response = await this.client.get('/api/public/comments', { params });
    return response.data;
  }

  async getComment(commentId: string): Promise<Comment> {
    const response = await this.client.get(`/api/public/comments/${commentId}`);
    return response.data;
  }

  // Dataset Items
  async createDatasetItem(data: CreateDatasetItemRequest): Promise<DatasetItem> {
    const response = await this.client.post('/api/public/dataset-items', data);
    return response.data;
  }

  async listDatasetItems(params?: PaginationParams & {
    datasetName?: string;
    sourceTraceId?: string;
    sourceObservationId?: string;
  }): Promise<PaginatedDatasetItems> {
    const response = await this.client.get('/api/public/dataset-items', { params });
    return response.data;
  }

  async getDatasetItem(id: string): Promise<DatasetItem> {
    const response = await this.client.get(`/api/public/dataset-items/${id}`);
    return response.data;
  }

  async deleteDatasetItem(id: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/public/dataset-items/${id}`);
    return response.data;
  }

  // Datasets
  async listDatasets(params?: PaginationParams): Promise<PaginatedDatasets> {
    const response = await this.client.get('/api/public/v2/datasets', { params });
    return response.data;
  }

  async createDataset(data: CreateDatasetRequest): Promise<Dataset> {
    const response = await this.client.post('/api/public/v2/datasets', data);
    return response.data;
  }

  async getDataset(datasetName: string): Promise<Dataset> {
    const response = await this.client.get(`/api/public/v2/datasets/${datasetName}`);
    return response.data;
  }

  // Traces
  async listTraces(params?: PaginationParams & {
    userId?: string;
    name?: string;
    sessionId?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    orderBy?: string;
    tags?: string[];
  }): Promise<PaginatedTraces> {
    const response = await this.client.get('/api/public/traces', { params });
    return response.data;
  }

  async getTrace(traceId: string): Promise<Trace> {
    const response = await this.client.get(`/api/public/traces/${traceId}`);
    return response.data;
  }

  async deleteTrace(traceId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/public/traces/${traceId}`);
    return response.data;
  }

  // Observations
  async getObservation(observationId: string): Promise<Observation> {
    const response = await this.client.get(`/api/public/observations/${observationId}`);
    return response.data;
  }

  async listObservations(params?: PaginationParams & {
    traceId?: string;
    name?: string;
    userId?: string;
    type?: string;
    fromStartTime?: string;
    toStartTime?: string;
  }): Promise<PaginatedObservations> {
    const response = await this.client.get('/api/public/observations', { params });
    return response.data;
  }

  // Sessions
  async listSessions(params?: PaginationParams & {
    fromTimestamp?: string;
    toTimestamp?: string;
  }): Promise<PaginatedSessions> {
    const response = await this.client.get('/api/public/sessions', { params });
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.client.get(`/api/public/sessions/${sessionId}`);
    return response.data;
  }

  // Scores
  async createScore(data: CreateScoreRequest): Promise<Score> {
    const response = await this.client.post('/api/public/scores', data);
    return response.data;
  }

  async listScores(params?: PaginationParams & {
    userId?: string;
    name?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    source?: string;
  }): Promise<PaginatedScores> {
    const response = await this.client.get('/api/public/scores', { params });
    return response.data;
  }

  async getScore(scoreId: string): Promise<Score> {
    const response = await this.client.get(`/api/public/scores/${scoreId}`);
    return response.data;
  }

  async deleteScore(scoreId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/public/scores/${scoreId}`);
    return response.data;
  }

  // Models
  async createModel(data: CreateModelRequest): Promise<Model> {
    const response = await this.client.post('/api/public/models', data);
    return response.data;
  }

  async listModels(params?: PaginationParams): Promise<PaginatedModels> {
    const response = await this.client.get('/api/public/models', { params });
    return response.data;
  }

  async getModel(modelId: string): Promise<Model> {
    const response = await this.client.get(`/api/public/models/${modelId}`);
    return response.data;
  }

  async deleteModel(modelId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/public/models/${modelId}`);
    return response.data;
  }

  // Projects
  async getProjects(): Promise<Projects> {
    const response = await this.client.get('/api/public/projects');
    return response.data;
  }
}