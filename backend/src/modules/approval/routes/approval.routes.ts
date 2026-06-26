import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { APPROVAL_PERMISSIONS } from '@modules/approval/constants/approval-permissions.constants.js';
import {
  addApprovalComment,
  approveRequest,
  bulkApproveRequests,
  createWorkflow,
  escalateRequest,
  getApprovalHistory,
  getApprovalInbox,
  getWorkflow,
  listApprovalRequests,
  listWorkflows,
  rejectRequest,
  updateWorkflow,
} from '@modules/approval/controllers/approval.controller.js';

const approvalRoutes = Router();

approvalRoutes.use(authenticateMiddleware);
approvalRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Approvals] */
approvalRoutes.get('/requests', authorize(APPROVAL_PERMISSIONS.READ), listApprovalRequests);
approvalRoutes.get('/inbox', authorize(APPROVAL_PERMISSIONS.READ), getApprovalInbox);
approvalRoutes.get('/requests/:id/history', authorize(APPROVAL_PERMISSIONS.READ), getApprovalHistory);
approvalRoutes.post('/requests/:id/approve', authorize(APPROVAL_PERMISSIONS.EXECUTE), approveRequest);
approvalRoutes.post('/requests/:id/reject', authorize(APPROVAL_PERMISSIONS.EXECUTE), rejectRequest);
approvalRoutes.post('/requests/:id/escalate', authorize(APPROVAL_PERMISSIONS.ESCALATE), escalateRequest);
approvalRoutes.post('/requests/:id/comments', authorize(APPROVAL_PERMISSIONS.READ), addApprovalComment);
approvalRoutes.post('/requests/bulk-approve', authorize(APPROVAL_PERMISSIONS.BULK), bulkApproveRequests);

approvalRoutes.get('/workflows', authorize(APPROVAL_PERMISSIONS.WORKFLOW_READ), listWorkflows);
approvalRoutes.post('/workflows', authorize(APPROVAL_PERMISSIONS.WORKFLOW_MANAGE), createWorkflow);
approvalRoutes.get('/workflows/:id', authorize(APPROVAL_PERMISSIONS.WORKFLOW_READ), getWorkflow);
approvalRoutes.patch('/workflows/:id', authorize(APPROVAL_PERMISSIONS.WORKFLOW_MANAGE), updateWorkflow);

export { approvalRoutes };
