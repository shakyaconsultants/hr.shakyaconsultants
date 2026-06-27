import type { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { DesignationService } from '@modules/organization/services/designation.service.js';

export const getDesignationDetail: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new Error('Invalid designation id');
    }
    const detail = await DesignationService.getDetail(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, detail);
  } catch (error) {
    next(error);
    return;
  }
};
