import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { MockQdrantServer } from './helpers/mock-qdrant-server';
import { QdrantClient, PointInsertOperations, SearchRequest } from '../src/lib/qdrant-client';
import { EnvConfig } from '../src/config/env';

describe('QdrantClient integration with mock Qdrant server', () => {
  const env: EnvConfig = {
    QDRANT_URL: '',
    QDRANT_API_KEY: '',
    HOST: '127.0.0.1',
    PORT: 0,
  };

  const mockServer = new MockQdrantServer();
  let client: QdrantClient;

  beforeAll(async () => {
    await mockServer.start();
    env.QDRANT_URL = mockServer.url;
    client = new QdrantClient(env);
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    mockServer.reset();
  });

  it('fetches collections from the API', async () => {
    mockServer.register('GET', '/collections', ({ res }) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          result: { collections: [{ name: 'docs' }], time: 1 },
          status: 'ok',
          time: 1,
        })
      );
    });

    const result = await client.getCollections();

    expect(result.collections).toEqual([{ name: 'docs' }]);
    expect(mockServer.lastRequest).toMatchObject({
      method: 'GET',
      path: '/collections',
    });
  });

  it('upserts points with wait and ordering parameters', async () => {
    mockServer.register('PUT', '/collections/demo/points', ({ res }) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          result: { operation_id: 42, status: 'completed', time: 1 },
          status: 'ok',
          time: 1,
        })
      );
    });

    const payload: PointInsertOperations = {
      points: [
        {
          id: 'point-1',
          vector: { default: [0.1, 0.2, 0.3] },
          payload: { tag: 'demo' },
        },
      ],
    };

    const response = await client.upsertPoints('demo', payload, true, { type: 'weak' });

    expect(response).toEqual({ operation_id: 42, status: 'completed', time: 1 });

    const lastRequest = mockServer.lastRequest!;
    expect(lastRequest.path).toBe('/collections/demo/points');
    expect(lastRequest.query).toEqual({
      wait: 'true',
      ordering: JSON.stringify({ type: 'weak' }),
    });
    expect(lastRequest.body).toEqual(payload);
  });

  it('performs vector search and returns scored points', async () => {
    mockServer.register('POST', '/collections/demo/points/search', ({ res }) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          result: [{ id: 'doc-1', version: 1, score: 0.91 }],
          status: 'ok',
          time: 1,
        })
      );
    });

    const request: SearchRequest = {
      vector: [0.25, 0.5, 0.75],
    };

    const results = await client.searchPoints('demo', request);

    expect(results).toEqual([{ id: 'doc-1', version: 1, score: 0.91 }]);
    expect(mockServer.lastRequest).toMatchObject({ method: 'POST', path: '/collections/demo/points/search' });
    expect(mockServer.lastRequest?.body).toEqual(request);
  });
});
