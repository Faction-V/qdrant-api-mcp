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
    private normalizeProfiles;
    private createFallbackProfile;
    private baseFallbackName;
}
export {};
