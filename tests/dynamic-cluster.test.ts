import { describe, it, expect, beforeEach } from 'vitest';
import { ClusterManager, ClusterProfile } from '../src/lib/cluster-manager';
import { EnvConfig } from '../src/config/env';

describe('Dynamic Cluster Registration', () => {
  let clusterManager: ClusterManager;
  const baseConfig: EnvConfig = {
    QDRANT_URL: 'http://localhost:6333',
    QDRANT_API_KEY: 'test-key',
    HOST: 'localhost',
    PORT: 3000,
  };

  beforeEach(() => {
    clusterManager = new ClusterManager(baseConfig, []);
  });

  it('should register a new dynamic cluster', () => {
    const url = 'https://test-cluster.example.com';
    const apiKey = 'secret-key';

    const clusterName = clusterManager.registerDynamicCluster(url, apiKey);

    expect(clusterName).toMatch(/^dynamic-[a-f0-9]{12}$/);
    const profile = clusterManager.getProfile(clusterName);
    expect(profile.url).toBe(url);
    expect(profile.apiKey).toBe(apiKey);
    expect(profile.labels).toContain('dynamic');
  });

  it('should return same cluster name for duplicate URL', () => {
    const url = 'https://test-cluster.example.com';

    const name1 = clusterManager.registerDynamicCluster(url, 'key1');
    const name2 = clusterManager.registerDynamicCluster(url, 'key2');

    expect(name1).toBe(name2);
  });

  it('should generate different names for different URLs', () => {
    const name1 = clusterManager.registerDynamicCluster('https://cluster1.example.com');
    const name2 = clusterManager.registerDynamicCluster('https://cluster2.example.com');

    expect(name1).not.toBe(name2);
  });

  it('should handle missing API key', () => {
    const url = 'https://test-cluster.example.com';

    const clusterName = clusterManager.registerDynamicCluster(url);

    const profile = clusterManager.getProfile(clusterName);
    expect(profile.apiKey).toBe('');
  });

  it('should allow using registered dynamic cluster', () => {
    const url = 'https://test-cluster.example.com';
    const clusterName = clusterManager.registerDynamicCluster(url, 'test-key');

    // Should not throw
    const { client, profile } = clusterManager.getClient(clusterName);
    expect(profile.url).toBe(url);
    expect(client).toBeDefined();
  });
});
