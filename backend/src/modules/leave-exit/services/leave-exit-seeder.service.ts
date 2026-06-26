import { ApprovalWorkflowService } from '@modules/approval/services/approval-workflow.service.js';
import { ExitManagementService } from '@modules/leave-exit/services/exit-management.service.js';
import {
  APPROVAL_REQUEST_TYPE,
  DEFAULT_EXIT_WORKFLOW_STAGES,
  DEFAULT_LEAVE_WORKFLOW_STAGES,
  DEFAULT_RESIGNATION_WORKFLOW_STAGES,
} from '@modules/approval/constants/approval.constants.js';
import { EXIT_CHECKLIST_CATEGORY } from '@domain/leave-exit/leave-exit.schemas.js';
import type { ApprovalActorContext } from '@modules/approval/types/approval.types.js';

export const LeaveExitSeederService = {
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
