export const MONGODB_HEALTH = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
} as const;

export const REDIS_HEALTH = {
  HEALTHY: 'healthy',
  UNAVAILABLE: 'unavailable',
} as const;

export const QUEUE_HEALTH = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const;

export type MongodbHealthStatus = (typeof MONGODB_HEALTH)[keyof typeof MONGODB_HEALTH];
export type RedisHealthStatus = (typeof REDIS_HEALTH)[keyof typeof REDIS_HEALTH];
export type QueueHealthStatus = (typeof QUEUE_HEALTH)[keyof typeof QUEUE_HEALTH];
