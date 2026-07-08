import type { Request, Response } from 'express';
import { HTTP_MESSAGES } from '@shared/constants/http.constants.js';
import { MONGODB_HEALTH } from '@shared/constants/health.constants.js';
import { getMongoConnectionState } from '@infrastructure/database/mongodb.connection.js';
import { SystemAdminService } from '@modules/settings/services/system-admin.service.js';
import { ResponseService } from '@shared/services/response.service.js';
import type { HealthCheckData } from '@shared/types/api.types.js';
import { asyncHandler } from '@middleware/async-handler.middleware.js';

function getMongoHealthStatus(): typeof MONGODB_HEALTH.HEALTHY | typeof MONGODB_HEALTH.UNHEALTHY {
  return getMongoConnectionState() === 1 ? MONGODB_HEALTH.HEALTHY : MONGODB_HEALTH.UNHEALTHY;
}

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  const mongodb = getMongoHealthStatus();
  const emailStatus = SystemAdminService.getEmailDeliveryStatus();

  const data: HealthCheckData = {
    mongodb,
    email: emailStatus.configured ? 'direct' : 'unconfigured',
  };

  const statusCode = mongodb === MONGODB_HEALTH.HEALTHY ? 200 : 503;
  ResponseService.success(res, req, data, HTTP_MESSAGES.OK, statusCode);
  await Promise.resolve();
});

/** Readiness probe — MongoDB required. */
export const getReadiness = asyncHandler(async (req: Request, res: Response) => {
  const mongodb = getMongoHealthStatus();
  const emailStatus = SystemAdminService.getEmailDeliveryStatus();
  const ready = mongodb === MONGODB_HEALTH.HEALTHY;

  const data: HealthCheckData = {
    mongodb,
    email: emailStatus.configured ? 'direct' : 'unconfigured',
  };

  ResponseService.success(
    res,
    req,
    data,
    ready ? HTTP_MESSAGES.OK : 'Service Unavailable',
    ready ? 200 : 503,
  );
  await Promise.resolve();
});
