export interface EnvConfig {
  LANGFUSE_BASE_URL: string;
  LANGFUSE_PUBLIC_KEY: string;
  LANGFUSE_SECRET_KEY: string;
  PORT: number;
  HOST: string;
}

export const defaultConfig: EnvConfig = {
  LANGFUSE_BASE_URL: 'https://cloud.langfuse.com',
  LANGFUSE_PUBLIC_KEY: '',
  LANGFUSE_SECRET_KEY: '',
  PORT: 3001,
  HOST: 'localhost'
};