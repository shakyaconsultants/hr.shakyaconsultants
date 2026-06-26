import { TaskAssignmentHistoryRepository } from '@domain/project/project-extended.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export interface AssignmentInput {
  taskId: string;
  projectId: string;
  assignedTo: string;
  previousAssigneeId?: string;
  reason?: string;
  isReassignment?: boolean;
}

export const TaskAssignmentService = {
  async recordAssignment(context: ProjectActorContext, input: AssignmentInput) {
    const id = generateUuid();
    const record = await TaskAssignmentHistoryRepository.create(
      {
        id,
        companyId: context.companyId,
        taskId: input.taskId,
        projectId: input.projectId,
        assignedBy: context.userId,
        assignedTo: input.assignedTo,
        previousAssigneeId: input.previousAssigneeId,
        reason: input.reason,
        isReassignment: input.isReassignment ?? false,
        assignedAt: new Date(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task_assignment',
      entityId: id,
      action: 'assign',
      after: ProjectAuditService.toRecord(record),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return record;
  },

  async listByTask(companyId: string, taskId: string) {
    const history = await TaskAssignmentHistoryRepository.findMany({ taskId }, { companyId });
    return history.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  },
};
