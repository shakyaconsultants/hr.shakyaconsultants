import { ApprovalWorkflowService } from '@modules/approval/services/approval-workflow.service.js';
import { ExitManagementService } from '@modules/leave-exit/services/exit-management.service.js';
import {
  APPROVAL_REQUEST_TYPE,
  DEFAULT_EXIT_WORKFLOW_STAGES,
  DEFAULT_LEAVE_WORKFLOW_STAGES,
  DEFAULT_RESIGNATION_WORKFLOW_STAGES,
} from '@modules/approval/constants/approval.constants.js';
import { EXIT_CHECKLIST_CATEGORY, LEAVE_POLICY_CATEGORY, LeavePolicyRepository } from '@domain/leave-exit/leave-exit.schemas.js';
import { LeaveTypeRepository } from '@domain/master-data/master-data.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { ApprovalActorContext } from '@modules/approval/types/approval.types.js';

const LEAVE_TYPE_POLICY_MAP: Record<string, { category: string; allowNegativeBalance?: boolean }> = {
  CL: { category: LEAVE_POLICY_CATEGORY.CASUAL },
  SL: { category: LEAVE_POLICY_CATEGORY.SICK },
  EL: { category: LEAVE_POLICY_CATEGORY.ANNUAL },
  LOP: { category: LEAVE_POLICY_CATEGORY.LOSS_OF_PAY, allowNegativeBalance: true },
};

export const LeaveExitSeederService = {
  async seedLeavePolicies(context: ApprovalActorContext): Promise<void> {
    const leaveTypes = await LeaveTypeRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId: context.companyId });

    for (const leaveType of leaveTypes) {
      const mapping = LEAVE_TYPE_POLICY_MAP[leaveType.code];
      if (!mapping) {
        continue;
      }

      const code = `POL-${leaveType.code}`;
      const existing = await LeavePolicyRepository.findOne({ code }, { companyId: context.companyId });
      if (existing) {
        continue;
      }

      await LeavePolicyRepository.create(
        {
          id: generateUuid(),
          companyId: context.companyId,
          name: leaveType.name,
          code,
          leaveTypeId: leaveType.id,
          category: mapping.category,
          annualQuota: leaveType.maxDaysPerYear ?? 0,
          carryForwardEnabled: leaveType.carryForward ?? false,
          allowHalfDay: true,
          allowNegativeBalance: mapping.allowNegativeBalance ?? false,
          accrualEnabled: false,
          requiresAttachment: false,
          allowSelfApproval: false,
          minNoticeDays: 0,
          emergencyLeaveAllowed: true,
          applicableDepartmentIds: [],
          applicableBranchIds: [],
          workflowSlug: 'leave-default',
          status: ENTITY_STATUS.ACTIVE,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }
  },

  async seedDefaults(context: ApprovalActorContext): Promise<void> {
    const workflows = [
      { name: 'Leave Approval', slug: 'leave-default', requestType: APPROVAL_REQUEST_TYPE.LEAVE, stages: DEFAULT_LEAVE_WORKFLOW_STAGES, isDefault: true },
      { name: 'Resignation Approval', slug: 'resignation-default', requestType: APPROVAL_REQUEST_TYPE.RESIGNATION, stages: DEFAULT_RESIGNATION_WORKFLOW_STAGES, isDefault: true },
      { name: 'Exit Clearance', slug: 'exit-default', requestType: APPROVAL_REQUEST_TYPE.EXIT_CLEARANCE, stages: DEFAULT_EXIT_WORKFLOW_STAGES, isDefault: true },
    ];

    for (const workflow of workflows) {
      try {
        await ApprovalWorkflowService.getBySlug(context.companyId, workflow.slug);
      } catch {
        await ApprovalWorkflowService.create(context, {
          name: workflow.name,
          slug: workflow.slug,
          requestType: workflow.requestType,
          stages: workflow.stages.map((s) => ({ ...s })),
          isDefault: workflow.isDefault,
        });
      }
    }

    await this.seedLeavePolicies(context);

    const checklistTemplates = [
      { name: 'HR Clearance', slug: 'hr-clearance', category: EXIT_CHECKLIST_CATEGORY.HR_CLEARANCE, sortOrder: 1 },
      { name: 'IT Asset Return', slug: 'it-asset-return', category: EXIT_CHECKLIST_CATEGORY.IT_ASSET_RETURN, sortOrder: 2, assigneeRoleSlug: 'hr' },
      { name: 'Finance Clearance', slug: 'finance-clearance', category: EXIT_CHECKLIST_CATEGORY.FINANCE_CLEARANCE, sortOrder: 3, assigneeRoleSlug: 'finance' },
      { name: 'Admin Clearance', slug: 'admin-clearance', category: EXIT_CHECKLIST_CATEGORY.ADMIN_CLEARANCE, sortOrder: 4 },
      { name: 'Manager Handover', slug: 'manager-handover', category: EXIT_CHECKLIST_CATEGORY.MANAGER_HANDOVER, sortOrder: 5, assigneeRoleSlug: 'project_manager' },
      { name: 'Document Collection', slug: 'document-collection', category: EXIT_CHECKLIST_CATEGORY.DOCUMENT_COLLECTION, sortOrder: 6 },
      { name: 'Experience Letter', slug: 'experience-letter', category: EXIT_CHECKLIST_CATEGORY.EXPERIENCE_LETTER, sortOrder: 7 },
      { name: 'Relieving Letter', slug: 'relieving-letter', category: EXIT_CHECKLIST_CATEGORY.RELIEVING_LETTER, sortOrder: 8 },
    ];

    for (const template of checklistTemplates) {
      await ExitManagementService.upsertTemplate(context, template);
    }
  },
};
