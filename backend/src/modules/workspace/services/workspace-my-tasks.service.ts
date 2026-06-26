import { TaskRepository } from '@domain/project/project.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import type { TaskDocument } from '@domain/project/project.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import type { MyTasksQuery, WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

const PENDING_STATUSES = [
  PROJECT_TASK_STATUS.BACKLOG,
  PROJECT_TASK_STATUS.TODO,
  PROJECT_TASK_STATUS.ASSIGNED,
  PROJECT_TASK_STATUS.IN_PROGRESS,
  PROJECT_TASK_STATUS.BLOCKED,
];

const COMPLETED_STATUSES = [PROJECT_TASK_STATUS.COMPLETED, PROJECT_TASK_STATUS.VERIFIED, PROJECT_TASK_STATUS.CLOSED];

export const WorkspaceMyTasksService = {
  async list(context: WorkspaceActorContext, query: MyTasksQuery) {
    const filters: Record<string, unknown>[] = [{ assigneeId: context.employeeId }];

    if (query.status === 'pending') {
      filters.push({ status: { $in: PENDING_STATUSES } });
    } else if (query.status === 'completed') {
      filters.push({ status: { $in: COMPLETED_STATUSES } });
    } else if (query.status === 'waiting_verification') {
      filters.push({ status: PROJECT_TASK_STATUS.COMPLETED });
    } else if (query.status === 'rejected') {
      filters.push({ status: PROJECT_TASK_STATUS.REJECTED });
    } else if (query.status) {
      filters.push({ status: query.status });
    }

    if (query.projectId) {
      filters.push({ projectId: query.projectId });
    }

    if (query.search) {
      filters.push(buildSearchFilter(query.search, ['title', 'description']));
    }

    const filter = mergeFilters(...filters);
    return TaskRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'dueDate',
      sortOrder: query.sortOrder ?? 'asc',
    }, { companyId: context.companyId });
  },

  async getKanban(context: WorkspaceActorContext, projectId?: string) {
    const filter: Record<string, unknown> = { assigneeId: context.employeeId };
    if (projectId) {
      filter.projectId = projectId;
    }

    const tasks = await TaskRepository.findMany(filter, { companyId: context.companyId });
    const columns: Record<string, TaskDocument[]> = {};
    for (const status of Object.values(PROJECT_TASK_STATUS)) {
      columns[status] = tasks.filter((t) => t.status === status);
    }
    return { columns: Object.fromEntries(Object.entries(columns).map(([k, v]) => [k, v.map(WorkspaceAuditService.toRecord)])), total: tasks.length };
  },

  async getCalendar(context: WorkspaceActorContext, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const tasks = await TaskRepository.findMany(
      {
        assigneeId: context.employeeId,
        dueDate: { $gte: start, $lte: end },
      },
      { companyId: context.companyId },
    );
    return { events: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.dueDate,
      status: t.status,
      projectId: t.projectId,
      type: 'task',
    })) };
  },

  async bulkUpdateStatus(context: WorkspaceActorContext, taskIds: string[], status: string) {
    const results = [];
    for (const taskId of taskIds) {
      const task = await TaskRepository.findById(taskId, { companyId: context.companyId });
      if (!task || task.assigneeId !== context.employeeId) {
        continue;
      }
      const updated = await TaskRepository.update(taskId, { status, updatedBy: context.userId }, { companyId: context.companyId });
      if (updated) {
        results.push(updated);
      }
    }
    return { updated: results.map(WorkspaceAuditService.toRecord), count: results.length };
  },

  async quickUpdate(context: WorkspaceActorContext, taskId: string, payload: { status?: string; progressPercent?: number }) {
    const task = await TaskRepository.findById(taskId, { companyId: context.companyId });
    if (!task || task.assigneeId !== context.employeeId) {
      throw new NotFoundError('Task not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await TaskRepository.update(
      taskId,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    return WorkspaceAuditService.toRecord(updated);
  },
};
