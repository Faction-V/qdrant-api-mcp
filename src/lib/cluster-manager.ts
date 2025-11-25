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
export class ClusterManager {
  private profiles: Map<string, ClusterProfile>;
  private clients: Map<string, ClusterClientEntry>;
  private activeCluster: string;
  private readonly baseConfig: EnvConfig;

  constructor(
    baseConfig: EnvConfig,
    profiles: ClusterProfile[],
    defaultCluster?: string
  ) {
    this.baseConfig = baseConfig;
    this.profiles = new Map();
    this.clients = new Map();

    const sanitizedProfiles = this.normalizeProfiles(profiles);
    if (sanitizedProfiles.length === 0) {
      sanitizedProfiles.push(this.createFallbackProfile());
    } else if (
      !sanitizedProfiles.some(
        (profile) => profile.name === this.baseFallbackName()
      )
    ) {
      sanitizedProfiles.push(this.createFallbackProfile());
    }

    sanitizedProfiles.forEach((profile) =>
      this.profiles.set(profile.name, profile)
    );

    const requestedCluster = defaultCluster ?? this.baseFallbackName();
    this.activeCluster = this.profiles.has(requestedCluster)
      ? requestedCluster
      : sanitizedProfiles[0].name;
  }

  listProfiles(): ClusterProfile[] {
    return Array.from(this.profiles.values());
  }

  getActiveCluster(): ClusterProfile {
    return this.getProfile(this.activeCluster);
  }

  getActiveClusterName(): string {
    return this.activeCluster;
  }

  setActiveCluster(name: string): ClusterProfile {
    const profile = this.getProfile(name);
    this.activeCluster = profile.name;
    return profile;
  }

  getProfile(name?: string): ClusterProfile {
    const resolvedName = name ?? this.activeCluster;
    const profile = this.profiles.get(resolvedName);
    if (!profile) {
      const available = Array.from(this.profiles.keys()).join(', ');
      throw new Error(
        `Unknown cluster '${resolvedName}'. Available clusters: ${available}`
      );
    }
    return profile;
  }

  getClient(name?: string): ClusterClientEntry {
    const profile = this.getProfile(name);
    const cached = this.clients.get(profile.name);
    if (cached) {
      return cached;
    }
    const client = new QdrantClient({
      QDRANT_URL: profile.url,
      QDRANT_API_KEY: profile.apiKey ?? '',
      HOST: this.baseConfig.HOST,
      PORT: this.baseConfig.PORT,
    });
    const entry = { profile, client };
    this.clients.set(profile.name, entry);
    return entry;
  }

  private normalizeProfiles(profiles: ClusterProfile[]): ClusterProfile[] {
    const seen = new Set<string>();
    return profiles
      .filter((profile) => Boolean(profile.name && profile.url))
      .map((profile) => ({
        ...profile,
        apiKey: profile.apiKey ?? '',
        description: profile.description ?? '',
        readOnly: profile.readOnly ?? false,
        labels: profile.labels ?? [],
      }))
      .filter((profile) => {
        if (seen.has(profile.name)) {
          return false;
        }
        seen.add(profile.name);
        return true;
      });
  }

  private createFallbackProfile(): ClusterProfile {
    return {
      name: this.baseFallbackName(),
      url: this.baseConfig.QDRANT_URL,
      apiKey: this.baseConfig.QDRANT_API_KEY,
      description: 'Fallback cluster derived from QDRANT_URL',
    };
  }

  private baseFallbackName(): string {
    return 'default';
  }
}
