import { FastifyEnvOptions } from '@fastify/env';

export interface EnvConfig {
  QDRANT_URL: string;
  QDRANT_API_KEY: string;
  PORT: number;
  HOST: string;
}

export const envSchema: FastifyEnvOptions = {
  schema: {
    type: 'object',
    required: ['QDRANT_URL', 'PORT', 'HOST'],
    properties: {
      QDRANT_URL: {
        type: 'string',
        default: 'http://localhost:6333'
      },
      QDRANT_API_KEY: {
        type: 'string',
        default: ''
      },
      PORT: {
        type: 'number',
        default: 3000
      },
      HOST: {
        type: 'string',
        default: 'localhost'
      }
    }
  },
  dotenv: true
};