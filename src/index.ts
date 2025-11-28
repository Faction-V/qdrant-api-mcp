import fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import { envSchema, EnvConfig } from './config/env';
import { McpServer } from './mcp/server';

/**
 * Bootstrap the application
 */
async function bootstrap() {
  // Create Fastify instance with logging
  const server = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  try {
    // Register environment variables plugin
    let config: EnvConfig;
    await server.register(fastifyEnv, {
      confKey: 'config',
      schema: envSchema.schema,
      dotenv: true,
      data: process.env
    });

    // Get config from decorated fastify instance
    config = {
      QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
      QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
      PORT: parseInt(process.env.PORT || '3000', 10),
      HOST: process.env.HOST || 'localhost'
    };

    // Register CORS plugin
    await server.register(fastifyCors, {
      origin: true, // Allow all origins
      methods: ['POST'], // Only allow POST requests for JSON-RPC
    });

    // Create MCP server
    new McpServer(server, config);

    // Add health check route
    const healthHandler = async () => ({ status: 'ok' });
    server.get('/health', healthHandler);
    server.get('/:serverSlug/health', healthHandler);

    // Start the server
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    server.log.info(`Server listening on ${config.HOST}:${config.PORT}`);
    server.log.info(`MCP endpoint available at http://${config.HOST}:${config.PORT}/mcp`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Start the application
bootstrap();
