"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.envSchema = {
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
//# sourceMappingURL=env.js.map