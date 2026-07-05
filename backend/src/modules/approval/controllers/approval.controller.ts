import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { ApprovalEngineService } from '@modules/approval/services/approval-engine.service.js';
import { ApprovalWorkflowService } from '@modules/approval/services/approval-workflow.service.js';
import { resolveApprovalActor } from '@modules/approval/types/approval.types.js';
import {
  approvalListQuerySchema,
  bulkApproveSchema,
  commentSchema,
  createWorkflowSchema,
  decisionSchema,
  idParamSchema,
  updateWorkflowSchema,
} from '@modules/approval/validators/approval.validator.js';

function actor(req: AuthenticatedRequest) {
  return resolveApprovalActor(req);
}

export const listApprovalRequests: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(approvalListQuerySchema, req.query);
    const data = await ApprovalEngineService.list(await actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getApprovalInbox: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(approvalListQuerySchema, req.query);
    const data = await ApprovalEngineService.getInbox(await actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getApprovalHistory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ApprovalEngineService.getHistory(await actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const approveRequest: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comments } = validateInput(decisionSchema, req.body);
    const data = await ApprovalEngineService.approve(await actor(authReq), id, comments);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const rejectRequest: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comments } = validateInput(decisionSchema, req.body);
    const data = await ApprovalEngineService.reject(await actor(authReq), id, comments);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkApproveRequests: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(bulkApproveSchema, req.body);
    const data = await ApprovalEngineService.bulkApprove(await actor(authReq), payload.requestIds, payload.comments);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const escalateRequest: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comments } = validateInput(decisionSchema, req.body);
    const data = await ApprovalEngineService.escalate(await actor(authReq), id, comments);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const addApprovalComment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comments } = validateInput(commentSchema, req.body);
    await ApprovalEngineService.addComment(await actor(authReq), id, comments);
    return ResponseService.success(res, authReq, { success: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listWorkflows: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const requestType = typeof req.query.requestType === 'string' ? req.query.requestType : undefined;
    const data = await ApprovalWorkflowService.list(authReq.user.companyId, requestType);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createWorkflow: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createWorkflowSchema, req.body);
    const data = await ApprovalWorkflowService.create(await actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateWorkflow: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateWorkflowSchema, req.body);
    const data = await ApprovalWorkflowService.update(await actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getWorkflow: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ApprovalWorkflowService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
