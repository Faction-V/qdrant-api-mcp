import { LangfuseClient } from './lib/langfuse-client.js';
import { EnvConfig } from './config/env.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create configuration
const config: EnvConfig = {
  LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
  LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
  LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || 'localhost'
};

// Example usage of the Langfuse client
async function main() {
  const client = new LangfuseClient(config);
  
  try {
    console.log('Testing Langfuse API connection...');
    const health = await client.healthCheck();
    console.log('Health check:', health);
    
    console.log('Listing traces...');
    const traces = await client.listTraces({ limit: 5 });
    console.log('Traces:', traces);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

if (require.main === module) {
  main();
}