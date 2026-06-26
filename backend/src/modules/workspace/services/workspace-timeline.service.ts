import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { EmployeeTimelineRepository } from '@domain/employee/employee-subresource.schemas.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import type { WorkspaceActorContext, WorkspaceListQuery } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceTimelineService = {
  async list(context: WorkspaceActorContext, query: WorkspaceListQuery) {
    const [activities, timeline] = await Promise.all([
      ActivityLogRepository.findMany({ userId: context.userId }, { companyId: context.companyId }),
      EmployeeTimelineRepository.findMany({ employeeId: context.employeeId }, { companyId: context.companyId }),
    ]);

    const merged = [
      ...activities.map((a) => ({
        id: a.id,
        type: 'activity',
        activityType: a.activityType,
        title: a.description,
        description: a.description,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: a.activityMeta,
        createdAt: a.createdAt,
      })),
      ...timeline.map((t) => ({
        id: t.id,
        type: 'timeline',
        activityType: t.eventType,
        title: t.title,
        description: t.description,
        entityType: 'employee',
        entityId: t.employeeId,
        metadata: t.metadata,
        createdAt: t.occurredAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let filtered = merged;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = merged.filter(
        (e) => e.title.toLowerCase().includes(term) || (e.description?.toLowerCase().includes(term) ?? false),
      );
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async getRecent(context: WorkspaceActorContext, limit = 20) {
    const filter = mergeFilters({ userId: context.userId });
    const activities = await ActivityLogRepository.findMany(filter, { companyId: context.companyId });
    const sorted = activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: sorted.slice(0, limit).map(WorkspaceAuditService.toRecord) };
  },
};
