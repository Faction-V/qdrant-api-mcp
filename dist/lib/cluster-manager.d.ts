import { EnvConfig } from '../config/env';
import { QdrantClient } from './qdrant-client';
export interface ClusterProfile {
    name: string;
    url: string;
    apiKey?: string;
    description?: string;
    readOnly?: boolean;
    labels?: string[];
}
interface ClusterClientEntry {
    profile: ClusterProfile;
    client: QdrantClient;
}
/**
 * Manages named Qdrant cluster profiles and lazily-instantiated clients.
 */
export declare class ClusterManager {
    private profiles;
    private clients;
    private activeCluster;
    private readonly baseConfig;
    constructor(baseConfig: EnvConfig, profiles: ClusterProfile[], defaultCluster?: string);
    listProfiles(): ClusterProfile[];
    getActiveCluster(): ClusterProfile;
    getActiveClusterName(): string;
    setActiveCluster(name: string): ClusterProfile;
    getProfile(name?: string): ClusterProfile;
    getClient(name?: string): ClusterClientEntry;
    /**
     * Register a cluster dynamically using URL and API key.
     * Returns a stable cluster name for the URL that can be used in subsequent calls.
     * If a cluster with this URL is already registered, returns the existing name.
     *
     * @param url - The Qdrant cluster URL
     * @param apiKey - Optional API key for authentication
     * @returns The cluster name to use in tool calls
     */
    registerDynamicCluster(url: string, apiKey?: string): string;
    /**
     * Normalize URL for consistent hashing and comparison.
     * - Lowercases hostname
     * - Removes trailing slashes
     * - Removes default ports (443 for https, 80 for http)
     * - Handles malformed URLs gracefully
     */
    private normalizeUrl;
    private normalizeProfiles;
    private createFallbackProfile;
    private baseFallbackName;
}
export {};
