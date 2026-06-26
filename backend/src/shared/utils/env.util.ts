import { Environment } from '@shared/enums/index.js';

export function isProduction(): boolean {
  return process.env.NODE_ENV === Environment.Production;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === Environment.Development;
}

export function isTest(): boolean {
  return process.env.NODE_ENV === Environment.Test;
}

export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
