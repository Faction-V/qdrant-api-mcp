"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterManager = void 0;
const qdrant_client_1 = require("./qdrant-client");
/**
 * Manages named Qdrant cluster profiles and lazily-instantiated clients.
 */
class ClusterManager {
    constructor(baseConfig, profiles, defaultCluster) {
        this.baseConfig = baseConfig;
        this.profiles = new Map();
        this.clients = new Map();
        const sanitizedProfiles = this.normalizeProfiles(profiles);
        if (sanitizedProfiles.length === 0) {
            sanitizedProfiles.push(this.createFallbackProfile());
        }
        else if (!sanitizedProfiles.some((profile) => profile.name === this.baseFallbackName())) {
            sanitizedProfiles.push(this.createFallbackProfile());
        }
        sanitizedProfiles.forEach((profile) => this.profiles.set(profile.name, profile));
        const requestedCluster = defaultCluster ?? this.baseFallbackName();
        this.activeCluster = this.profiles.has(requestedCluster)
            ? requestedCluster
            : sanitizedProfiles[0].name;
    }
    listProfiles() {
        return Array.from(this.profiles.values());
    }
    getActiveCluster() {
        return this.getProfile(this.activeCluster);
    }
    getActiveClusterName() {
        return this.activeCluster;
    }
    setActiveCluster(name) {
        const profile = this.getProfile(name);
        this.activeCluster = profile.name;
        return profile;
    }
    getProfile(name) {
        const resolvedName = name ?? this.activeCluster;
        const profile = this.profiles.get(resolvedName);
        if (!profile) {
            const available = Array.from(this.profiles.keys()).join(', ');
            throw new Error(`Unknown cluster '${resolvedName}'. Available clusters: ${available}`);
        }
        return profile;
    }
    getClient(name) {
        const profile = this.getProfile(name);
        const cached = this.clients.get(profile.name);
        if (cached) {
            return cached;
        }
        const client = new qdrant_client_1.QdrantClient({
            QDRANT_URL: profile.url,
            QDRANT_API_KEY: profile.apiKey ?? '',
            HOST: this.baseConfig.HOST,
            PORT: this.baseConfig.PORT,
        });
        const entry = { profile, client };
        this.clients.set(profile.name, entry);
        return entry;
    }
    normalizeProfiles(profiles) {
        const seen = new Set();
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
    createFallbackProfile() {
        return {
            name: this.baseFallbackName(),
            url: this.baseConfig.QDRANT_URL,
            apiKey: this.baseConfig.QDRANT_API_KEY,
            description: 'Fallback cluster derived from QDRANT_URL',
        };
    }
    baseFallbackName() {
        return 'default';
    }
}
exports.ClusterManager = ClusterManager;
//# sourceMappingURL=cluster-manager.js.map