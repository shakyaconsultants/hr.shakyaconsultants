import { TaskRepository, ProjectRepository } from '@domain/project/project.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { EmployeeDocumentFileRepository } from '@domain/employee/employee.schemas.js';
import { AnnouncementRepository } from '@domain/communication/communication.schemas.js';
import { ANNOUNCEMENT_AUDIENCE } from '@domain/communication/communication.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import type { SearchQuery, WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';

export const WorkspaceSearchService = {
  async search(context: WorkspaceActorContext, query: SearchQuery) {
    const term = query.q.toLowerCase();
    const limit = query.limit ?? 10;
    const types = query.types ?? ['projects', 'tasks', 'announcements', 'documents'];
    const results: Record<string, unknown>[] = [];

    if (types.includes('projects')) {
      const memberships = await ProjectMemberRepository.findMany({ employeeId: context.employeeId }, { companyId: context.companyId });
      const projectIds = memberships.map((m) => m.projectId);
      if (projectIds.length > 0) {
        const projects = await ProjectRepository.findMany({ id: { $in: projectIds } }, { companyId: context.companyId });
        for (const project of projects) {
          if (project.name.toLowerCase().includes(term) || project.code.toLowerCase().includes(term)) {
            results.push({ type: 'project', id: project.id, title: project.name, subtitle: project.code, data: WorkspaceAuditService.toRecord(project) });
          }
        }
      }
    }

    if (types.includes('tasks')) {
      const tasks = await TaskRepository.findMany({ assigneeId: context.employeeId }, { companyId: context.companyId });
      for (const task of tasks) {
        if (task.title.toLowerCase().includes(term) || (task.description?.toLowerCase().includes(term) ?? false)) {
          results.push({ type: 'task', id: task.id, title: task.title, subtitle: task.status, data: WorkspaceAuditService.toRecord(task) });
        }
      }
    }

    if (types.includes('documents')) {
      const documents = await EmployeeDocumentFileRepository.findMany(
        { employeeId: context.employeeId, isLatest: true },
        { companyId: context.companyId },
      );
      for (const doc of documents) {
        if (doc.fileName.toLowerCase().includes(term) || doc.documentType.toLowerCase().includes(term)) {
          results.push({ type: 'document', id: doc.id, title: doc.fileName, subtitle: doc.documentType, data: WorkspaceAuditService.toRecord(doc) });
        }
      }
    }

    if (types.includes('announcements')) {
      const employee = await EmployeeRepository.findById(context.employeeId, { companyId: context.companyId });
      if (employee) {
        const announcements = await AnnouncementRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId: context.companyId });
        for (const announcement of announcements) {
          const audienceMatch =
            announcement.targetAudience === ANNOUNCEMENT_AUDIENCE.ALL
            || (announcement.targetAudience === ANNOUNCEMENT_AUDIENCE.DEPARTMENT && announcement.targetIds.includes(employee.departmentId))
            || (announcement.targetAudience === ANNOUNCEMENT_AUDIENCE.BRANCH && employee.branchId && announcement.targetIds.includes(employee.branchId));

          if (audienceMatch && (announcement.title.toLowerCase().includes(term) || announcement.content.toLowerCase().includes(term))) {
            results.push({ type: 'announcement', id: announcement.id, title: announcement.title, subtitle: announcement.priority, data: WorkspaceAuditService.toRecord(announcement) });
          }
        }
      }
    }

    return { query: query.q, results: results.slice(0, limit), total: results.length };
  },
};
