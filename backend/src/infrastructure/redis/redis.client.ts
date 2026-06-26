import { Redis } from 'ioredis';
import { getEnv } from '@config/env.js';
import {
  buildRedisClientOptions,
  buildRedisUrl,
  getRedisConnectionOptions,
  isRedisConfigured,
} from '@infrastructure/redis/redis.config.js';
import { logger } from '@logging/winston.logger.js';

export { getRedisConnectionOptions, isRedisConfigured };

let redisClient: Redis | null = null;
let redisAvailable = false;
let startupWarningLogged = false;

function logRedisStartupWarning(message: string, meta?: Record<string, unknown>): void {
  if (!startupWarningLogged) {
    logger.warn(message, meta);
    startupWarningLogged = true;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

export function getRedisClient(): Redis {
  if (!isRedisAvailable() || !redisClient) {
    throw new Error('Redis is unavailable. Cache and queue operations are disabled.');
  }
  return redisClient;
}

export async function connectRedis(): Promise<boolean> {
  if (redisAvailable && redisClient) {
    return true;
  }

  if (!isRedisConfigured()) {
    logRedisStartupWarning('Redis not configured (REDIS_URL empty) — cache and BullMQ disabled');
    return false;
  }

  const url = buildRedisUrl();
  if (!url) {
    logRedisStartupWarning('Redis URL could not be resolved — cache and BullMQ disabled');
    return false;
  }

  const client = new Redis(url, {
    ...buildRedisClientOptions(url),
    keyPrefix: `${getEnv().QUEUE_PREFIX}:`,
  });

  try {
    await client.connect();
    await client.ping();
    redisClient = client;
    redisAvailable = true;
    logger.info('Redis connected via Upstash', { tls: url.startsWith('rediss://') });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    logRedisStartupWarning('Redis connection failed — cache and BullMQ disabled', { error: message });
    try {
      client.disconnect();
    } catch {
      // ignore cleanup errors
    }
    redisClient = null;
    redisAvailable = false;
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisAvailable = false;
    logger.info('Redis disconnected');
  }
}

export async function checkRedisHealth(): Promise<'healthy' | 'unavailable'> {
  if (!isRedisAvailable()) {
    return 'unavailable';
  }

  try {
    await getRedisClient().ping();
    return 'healthy';
  } catch {
    return 'unavailable';
  }
}
