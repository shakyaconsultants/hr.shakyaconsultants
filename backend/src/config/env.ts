import dotenv from 'dotenv';
import { validateEnv, type EnvConfig } from '@config/env.schema.js';

dotenv.config();

let cachedConfig: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv(process.env);
  }
  return cachedConfig;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}
