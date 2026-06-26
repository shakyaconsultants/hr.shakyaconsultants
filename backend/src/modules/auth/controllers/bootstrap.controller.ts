import type { Request, Response } from 'express';
import { BootstrapService } from '@modules/auth/services/bootstrap.service.js';
import { SystemInitService } from '@modules/auth/services/system-init.service.js';
import { bootstrapSchema } from '@modules/auth/validators/bootstrap.validator.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { toBootstrapResponse } from '@modules/auth/dto/auth.dto.js';
import { ResponseService } from '@shared/services/response.service.js';
import { asyncHandler } from '@middleware/async-handler.middleware.js';

export const bootstrap = asyncHandler(async (req: Request, res: Response) => {
  const input = validateInput(bootstrapSchema, req.body);
  const result = await BootstrapService.bootstrapSystem(input);
  ResponseService.created(res, req, toBootstrapResponse(result));
});

export const getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
  const initialized = await SystemInitService.isSystemInitialized();
  ResponseService.success(res, req, { initialized });
});
