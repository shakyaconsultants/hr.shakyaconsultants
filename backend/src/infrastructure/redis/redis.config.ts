import type { RedisOptions } from 'ioredis';
import type { ConnectionOptions } from 'bullmq';
import { getEnv } from '@config/env.js';

const REDIS_CONNECT_TIMEOUT_MS = 10_000;

export function isRedisConfigured(): boolean {
  return sanitizeRedisUrlInput(getEnv().REDIS_URL).length > 0;
}

/** Strips accidental quotes / duplicated key prefixes from .env values. */
export function sanitizeRedisUrlInput(raw: string): string {
  let value = raw.trim();
  if (value.startsWith('REDIS_URL=')) {
    value = value.slice('REDIS_URL='.length).trim();
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

export function buildRedisUrl(): string | null {
  if (!isRedisConfigured()) {
    return null;
  }

  return normalizeRedisUrl(sanitizeRedisUrlInput(getEnv().REDIS_URL));
}

/**
 * Normalizes Redis URLs for ioredis.
 * Prefer the official Upstash format with embedded credentials:
 *   rediss://default:YOUR_TOKEN@your-endpoint.upstash.io:6379
 */
export function normalizeRedisUrl(rawUrl: string): string {
  if (rawUrl.startsWith('rediss://') || rawUrl.startsWith('redis://')) {
    return rawUrl;
  }

  if (rawUrl.startsWith('https://') || rawUrl.startsWith('http://')) {
    const parsed = new URL(rawUrl);
    const port = parsed.port.length > 0 ? parsed.port : '6379';
    const auth =
      parsed.username.length > 0 || parsed.password.length > 0
        ? `${parsed.username || 'default'}:${parsed.password}@`
        : '';
    return `rediss://${auth}${parsed.hostname}:${port}`;
  }

  return rawUrl;
}

export function isTlsEnabled(url: string): boolean {
  return url.startsWith('rediss://');
}

export function buildRedisClientOptions(url: string): RedisOptions {
  return {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    reconnectOnError: () => false,
    ...(isTlsEnabled(url) ? { tls: {} } : {}),
  };
}

export function getRedisConnectionOptions(): ConnectionOptions {
  const url = buildRedisUrl();
  if (!url) {
    throw new Error('Redis is not configured');
  }

  const parsed = new URL(url);
  const tls = isTlsEnabled(url);

  return {
    host: parsed.hostname,
    port: parsed.port.length > 0 ? Number.parseInt(parsed.port, 10) : 6379,
    username: parsed.username.length > 0 ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password.length > 0 ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    reconnectOnError: () => false,
    ...(tls ? { tls: {} } : {}),
  };
}
