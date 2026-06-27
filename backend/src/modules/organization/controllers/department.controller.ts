import type { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { DepartmentService } from '@modules/organization/services/department.service.js';

export const getDepartmentStats: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const stats = await DepartmentService.getCompanyStats(authReq.user.companyId);
    return ResponseService.success(res, authReq, stats);
  } catch (error) {
    next(error);
    return;
  }
};

export const getDepartmentDetail: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw new Error('Invalid department id');
    }
    const detail = await DepartmentService.getDetail(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, detail);
  } catch (error) {
    next(error);
    return;
  }
};
