import {
  ExitProcessRepository,
  ExitChecklistItemRepository,
  ExitChecklistTemplateRepository,
  EXIT_CHECKLIST_ITEM_STATUS,
  EXIT_PROCESS_STATUS,
} from '@domain/leave-exit/leave-exit.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { LeaveExitAuditService } from '@modules/leave-exit/services/leave-exit-audit.service.js';
import { LeaveExitEventService, LEAVE_EXIT_NOTIFICATION_JOB } from '@modules/leave-exit/services/leave-exit-event.service.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

export const ExitManagementService = {
  async listTemplates(companyId: string) {
    return ExitChecklistTemplateRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId });
  },

  async upsertTemplate(context: LeaveExitActorContext, payload: {
    name: string;
    slug: string;
    category: string;
    description?: string;
    sortOrder?: number;
    isRequired?: boolean;
    assigneeRoleSlug?: string;
  }) {
    const existing = await ExitChecklistTemplateRepository.findOne({ slug: payload.slug }, { companyId: context.companyId });
    if (existing) {
      return ExitChecklistTemplateRepository.update(existing.id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    }

    const id = generateUuid();
    return ExitChecklistTemplateRepository.create(
      {
        id,
        companyId: context.companyId,
        ...payload,
        sortOrder: payload.sortOrder ?? 0,
        isRequired: payload.isRequired ?? true,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async startExitProcess(context: LeaveExitActorContext, resignation: { id: string; employeeId: string; expectedLastWorkingDay: Date }) {
    const id = generateUuid();
    const process = await ExitProcessRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: resignation.employeeId,
        resignationId: resignation.id,
        status: EXIT_PROCESS_STATUS.IN_PROGRESS,
        startedAt: new Date(),
        expectedLastWorkingDay: resignation.expectedLastWorkingDay,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const templates = await ExitChecklistTemplateRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId: context.companyId });
    for (const template of templates.sort((a, b) => a.sortOrder - b.sortOrder)) {
      await ExitChecklistItemRepository.create(
        {
          id: generateUuid(),
          companyId: context.companyId,
          exitProcessId: id,
          templateId: template.id,
          category: template.category,
          title: template.name,
          description: template.description,
          sortOrder: template.sortOrder,
          isRequired: template.isRequired,
          status: EXIT_CHECKLIST_ITEM_STATUS.PENDING,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }

    const { FullFinalPreparationService } = await import('@modules/leave-exit/services/full-final-preparation.service.js');
    await FullFinalPreparationService.prepare(context, resignation.employeeId, id, resignation.id);

    await LeaveExitEventService.notify(context, {
      recipientUserId: context.userId,
      title: 'Exit process started',
      body: 'Employee exit checklist has been initiated.',
      entityType: 'exit_process',
      entityId: id,
      jobName: LEAVE_EXIT_NOTIFICATION_JOB.EXIT_STARTED,
    });

    return process;
  },

  async getProcess(companyId: string, exitProcessId: string) {
    const process = await ExitProcessRepository.findById(exitProcessId, { companyId });
    if (!process) {
      throw new NotFoundError('Exit process not found', ERROR_CODES.NOT_FOUND);
    }
    const items = await ExitChecklistItemRepository.findMany({ exitProcessId }, { companyId });
    return { process, items: items.sort((a, b) => a.sortOrder - b.sortOrder) };
  },

  async completeChecklistItem(context: LeaveExitActorContext, itemId: string, notes?: string) {
    const item = await ExitChecklistItemRepository.findById(itemId, { companyId: context.companyId });
    if (!item) {
      throw new NotFoundError('Checklist item not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await ExitChecklistItemRepository.update(
      itemId,
      {
        status: EXIT_CHECKLIST_ITEM_STATUS.COMPLETED,
        completedAt: new Date(),
        completedBy: context.userId,
        notes,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await LeaveExitAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'exit_checklist_item',
      entityId: itemId,
      action: 'clear',
      after: LeaveExitAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const items = await ExitChecklistItemRepository.findMany({ exitProcessId: item.exitProcessId }, { companyId: context.companyId });
    const allRequiredDone = items.filter((i) => i.isRequired).every((i) => i.status === EXIT_CHECKLIST_ITEM_STATUS.COMPLETED);

    if (allRequiredDone) {
      await ExitProcessRepository.update(
        item.exitProcessId,
        { status: EXIT_PROCESS_STATUS.COMPLETED, completedAt: new Date(), updatedBy: context.userId },
        { companyId: context.companyId },
      );

      await LeaveExitEventService.notify(context, {
        recipientUserId: context.userId,
        title: 'Exit process completed',
        body: 'All required exit checklist items are complete.',
        entityType: 'exit_process',
        entityId: item.exitProcessId,
        jobName: LEAVE_EXIT_NOTIFICATION_JOB.EXIT_COMPLETED,
      });
    }

    return updated;
  },

  async onApprovalDecision(_context: LeaveExitActorContext, _exitProcessId: string, _approvalStatus: string): Promise<void> {
    // Reserved for exit clearance approval workflows
  },
};
