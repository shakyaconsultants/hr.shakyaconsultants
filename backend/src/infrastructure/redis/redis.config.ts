import type { RedisOptions } from 'ioredis';
import type { ConnectionOptions } from 'bullmq';
import { getEnv } from '@config/env.js';

const REDIS_CONNECT_TIMEOUT_MS = 10_000;

export function isRedisConfigured(): boolean {
  return getEnv().REDIS_URL.trim().length > 0;
}

export function buildRedisUrl(): string | null {
  if (!isRedisConfigured()) {
    return null;
  }

  const env = getEnv();
  let url = normalizeRedisUrl(env.REDIS_URL.trim());
  const token = env.REDIS_TOKEN.trim();

  if (token.length > 0) {
    const parsed = new URL(url);
    if (parsed.password.length === 0) {
      parsed.username = parsed.username.length > 0 ? parsed.username : 'default';
      parsed.password = token;
      url = parsed.toString();
    }
  }

  return url;
}

/** Converts Upstash REST host URLs to the official ioredis rediss:// endpoint. */
export function normalizeRedisUrl(rawUrl: string): string {
  if (rawUrl.startsWith('rediss://') || rawUrl.startsWith('redis://')) {
    return rawUrl;
  }

  if (rawUrl.startsWith('https://') || rawUrl.startsWith('http://')) {
    const parsed = new URL(rawUrl);
    return `rediss://${parsed.hostname}:6379`;
  }

  return rawUrl;
}

export function isTlsEnabled(url: string): boolean {
  return url.startsWith('rediss://');
}

export function buildRedisClientOptions(url: string): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    retryStrategy: () => null,
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
    ...(tls ? { tls: {} } : {}),
  };
}

/** Reserved for Upstash REST API usage (HTTP-based operations). */
export function getRedisRestCredentials(): { url: string; token: string } | null {
  const env = getEnv();
  const url = env.REDIS_REST_URL.trim();
  const token = env.REDIS_REST_TOKEN.trim();

  if (url.length === 0 || token.length === 0) {
    return null;
  }

  return { url, token };
}
