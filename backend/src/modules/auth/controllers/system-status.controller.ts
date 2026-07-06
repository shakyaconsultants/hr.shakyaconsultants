import type { Request, Response } from 'express';
import { SystemInitService } from '@modules/auth/services/system-init.service.js';
import { ResponseService } from '@shared/services/response.service.js';
import { asyncHandler } from '@middleware/async-handler.middleware.js';

export const getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
  const initialized = await SystemInitService.isSystemInitialized();
  ResponseService.success(res, req, { initialized });
});
