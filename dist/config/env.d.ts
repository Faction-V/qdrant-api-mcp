import { FastifyEnvOptions } from '@fastify/env';
export interface EnvConfig {
    QDRANT_URL: string;
    QDRANT_API_KEY: string;
    PORT: number;
    HOST: string;
}
export declare const envSchema: FastifyEnvOptions;
