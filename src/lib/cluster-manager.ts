import { EnvConfig } from '../config/env';
import { QdrantClient } from './qdrant-client';
import { createHash } from 'crypto';

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

  /**
   * Register a cluster dynamically using URL and API key.
   * Returns a stable cluster name for the URL that can be used in subsequent calls.
   * If a cluster with this URL is already registered, returns the existing name.
   *
   * @param url - The Qdrant cluster URL
   * @param apiKey - Optional API key for authentication
   * @returns The cluster name to use in tool calls
   */
  registerDynamicCluster(url: string, apiKey?: string): string {
    // Input validation
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('URL is required and must be a non-empty string');
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}. ${error instanceof Error ? error.message : String(error)}`);
    }

    // Normalize URL before hashing
    const normalizedUrl = this.normalizeUrl(parsedUrl);

    // Generate stable name from normalized URL hash
    const hash = createHash('sha256')
      .update(normalizedUrl)
      .digest('hex')
      .substring(0, 12);
    const clusterName = `dynamic-${hash}`;

    // Check if already registered
    if (this.profiles.has(clusterName)) {
      return clusterName;
    }

    // Register new dynamic cluster
    const profile: ClusterProfile = {
      name: clusterName,
      url: normalizedUrl,
      apiKey: apiKey ?? '',
      description: `Dynamic cluster: ${normalizedUrl}`,
      labels: ['dynamic'],
    };

    this.profiles.set(clusterName, profile);
    return clusterName;
  }

  /**
   * Normalize URL for consistent hashing and comparison.
   * - Lowercases hostname
   * - Removes trailing slashes
   * - Removes default ports (443 for https, 80 for http)
   * - Handles malformed URLs gracefully
   */
  private normalizeUrl(parsedUrl: URL): string {
    try {
      // Lowercase the hostname
      const hostname = parsedUrl.hostname.toLowerCase();

      // Get the protocol
      const protocol = parsedUrl.protocol;

      // Remove default ports
      let port = parsedUrl.port;
      if ((protocol === 'https:' && port === '443') || (protocol === 'http:' && port === '80')) {
        port = '';
      }

      // Reconstruct the URL
      let normalized = `${protocol}//${hostname}`;
      if (port) {
        normalized += `:${port}`;
      }

      // Add pathname, removing trailing slashes
      let pathname = parsedUrl.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      normalized += pathname;

      // Add search params if present
      if (parsedUrl.search) {
        normalized += parsedUrl.search;
      }

      return normalized;
    } catch (error) {
      // If normalization fails for any reason, return the original URL string
      // This ensures we don't break existing functionality
      return parsedUrl.toString();
    }
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
