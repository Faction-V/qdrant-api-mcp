import { FastifyInstance } from 'fastify';
import { EnvConfig } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
  }
}