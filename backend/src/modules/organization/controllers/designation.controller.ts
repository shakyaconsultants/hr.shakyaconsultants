import type { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ResponseService } from '@shared/services/response.service.js';
import { DesignationService } from '@modules/organization/services/designation.service.js';

export const getDesignationDetail: RequestHandler = async (
  req,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('Invalid designation id', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }
    const detail = await DesignationService.getDetail(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, detail);
  } catch (error) {
    next(error);
    return;
  }
};
