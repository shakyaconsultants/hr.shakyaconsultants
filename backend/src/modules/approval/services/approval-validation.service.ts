import type { ApprovalWorkflowDocument, ApprovalWorkflowStageDefinition } from '@domain/approval/approval.schemas.js';
import { ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export const ApprovalValidationService = {
  assertValidWorkflow(workflow: ApprovalWorkflowDocument): void {
    if (workflow.stages.length === 0) {
      throw new ValidationError('Workflow must have at least one approval stage');
    }

    const orders = workflow.stages.map((s) => s.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      throw new ValidationError('Workflow stages must have unique order values');
    }

    const slugs = workflow.stages.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);
    if (uniqueSlugs.size !== slugs.length) {
      throw new ValidationError('Workflow stages must have unique slugs');
    }

    for (const stage of workflow.stages) {
      this.assertValidStage(stage);
    }
  },

  assertValidStage(stage: ApprovalWorkflowStageDefinition): void {
    if (!stage.name || !stage.slug) {
      throw new ValidationError('Each workflow stage requires name and slug');
    }
    if (stage.approverType === 'role' && !stage.approverRoleSlug) {
      throw new ValidationError(`Stage ${stage.slug} requires approverRoleSlug for role-based approval`);
    }
    if (stage.approverType === 'employee' && !stage.approverEmployeeId) {
      throw new ValidationError(`Stage ${stage.slug} requires approverEmployeeId for employee-based approval`);
    }
  },

  assertNotSelfApproval(
    actorEmployeeId: string | undefined,
    requesterEmployeeId: string,
    stage: ApprovalWorkflowStageDefinition,
  ): void {
    if (!actorEmployeeId) {
      return;
    }
    if (actorEmployeeId === requesterEmployeeId && !stage.allowSelfApproval) {
      throw new ConflictError('Cannot approve own request', ERROR_CODES.CONFLICT);
    }
  },

  assertIsPendingApprover(
    actorEmployeeId: string | undefined,
    pendingApproverEmployeeIds: string[],
  ): void {
    if (!actorEmployeeId || !pendingApproverEmployeeIds.includes(actorEmployeeId)) {
      throw new ConflictError('You are not an authorized approver for this request', ERROR_CODES.CONFLICT);
    }
  },

  assertNoDuplicateAction(existingActions: { actorUserId: string; stageSlug?: string; action: string }[], actorUserId: string, stageSlug: string): void {
    const duplicate = existingActions.some(
      (a) => a.actorUserId === actorUserId && a.stageSlug === stageSlug && (a.action === 'approve' || a.action === 'reject'),
    );
    if (duplicate) {
      throw new ConflictError('Duplicate approval action for this stage', ERROR_CODES.CONFLICT);
    }
  },
};
