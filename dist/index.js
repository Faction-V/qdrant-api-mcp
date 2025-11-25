"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const env_1 = __importDefault(require("@fastify/env"));
const cors_1 = __importDefault(require("@fastify/cors"));
const env_2 = require("./config/env");
const server_1 = require("./mcp/server");
/**
 * Bootstrap the application
 */
async function bootstrap() {
    // Create Fastify instance with logging
    const server = (0, fastify_1.default)({
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
        let config;
        await server.register(env_1.default, {
            confKey: 'config',
            schema: env_2.envSchema.schema,
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
        await server.register(cors_1.default, {
            origin: true, // Allow all origins
            methods: ['POST'], // Only allow POST requests for JSON-RPC
        });
        // Create MCP server
        new server_1.McpServer(server, config);
        // Add health check route
        server.get('/health', async () => {
            return { status: 'ok' };
        });
        // Start the server
        await server.listen({
            port: config.PORT,
            host: config.HOST,
        });
        server.log.info(`Server listening on ${config.HOST}:${config.PORT}`);
        server.log.info(`MCP endpoint available at http://${config.HOST}:${config.PORT}/mcp`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
// Start the application
bootstrap();
//# sourceMappingURL=index.js.map