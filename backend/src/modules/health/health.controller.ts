import type { Request, Response } from 'express';
import { HTTP_MESSAGES } from '@shared/constants/http.constants.js';
import { MONGODB_HEALTH } from '@shared/constants/health.constants.js';
import { getMongoConnectionState } from '@infrastructure/database/mongodb.connection.js';
import { checkRedisHealth } from '@infrastructure/redis/redis.client.js';
import { getQueueHealthStatus } from '@infrastructure/queue/bullmq.connection.js';
import { ResponseService } from '@shared/services/response.service.js';
import type { HealthCheckData } from '@shared/types/api.types.js';
import { asyncHandler } from '@middleware/async-handler.middleware.js';

function getMongoHealthStatus(): typeof MONGODB_HEALTH.HEALTHY | typeof MONGODB_HEALTH.UNHEALTHY {
  return getMongoConnectionState() === 1 ? MONGODB_HEALTH.HEALTHY : MONGODB_HEALTH.UNHEALTHY;
}

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  const redis = await checkRedisHealth();
  const queue = getQueueHealthStatus();
  const mongodb = getMongoHealthStatus();

  const data: HealthCheckData = {
    mongodb,
    redis,
    queue,
  };

  const statusCode = mongodb === MONGODB_HEALTH.HEALTHY ? 200 : 503;
  ResponseService.success(res, req, data, HTTP_MESSAGES.OK, statusCode);
});
