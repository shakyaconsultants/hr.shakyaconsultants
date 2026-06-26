import { ProjectMemberRepository, ProjectRepository, MilestoneRepository, SprintRepository, TaskRepository } from '@domain/project/project.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import type { WorkspaceActorContext, WorkspaceListQuery } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceMyProjectsService = {
  async list(context: WorkspaceActorContext, query: WorkspaceListQuery) {
    const memberships = await ProjectMemberRepository.findMany({ employeeId: context.employeeId }, { companyId: context.companyId });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return { items: [], total: 0 };
    }

    let projects = await ProjectRepository.findMany(
      { id: { $in: projectIds }, isArchived: false },
      { companyId: context.companyId },
    );

    if (query.search) {
      const term = query.search.toLowerCase();
      projects = projects.filter(
        (p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term),
      );
    }

    const [tasks, milestones, sprints] = await Promise.all([
      TaskRepository.findMany({ projectId: { $in: projectIds } }, { companyId: context.companyId }),
      MilestoneRepository.findMany({ projectId: { $in: projectIds } }, { companyId: context.companyId }),
      SprintRepository.findMany({ projectId: { $in: projectIds } }, { companyId: context.companyId }),
    ]);

    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const items = projects.map((project) => {
      const membership = memberships.find((m) => m.projectId === project.id);
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const completed = projectTasks.filter((t) =>
        [PROJECT_TASK_STATUS.COMPLETED, PROJECT_TASK_STATUS.VERIFIED, PROJECT_TASK_STATUS.CLOSED].includes(t.status as typeof PROJECT_TASK_STATUS.COMPLETED),
      ).length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      const upcomingDeadlines = projectTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= horizon)
        .sort((a, b) => {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return aDate - bDate;
        })
        .slice(0, 5);

      return {
        project: WorkspaceAuditService.toRecord(project),
        role: membership?.role,
        progress,
        totalTasks: projectTasks.length,
        completedTasks: completed,
        upcomingDeadlines: upcomingDeadlines.map(WorkspaceAuditService.toRecord),
        milestones: milestones.filter((m) => m.projectId === project.id).map(WorkspaceAuditService.toRecord),
        sprints: sprints.filter((s) => s.projectId === project.id).map(WorkspaceAuditService.toRecord),
      };
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return { items: paged, total: items.length, page, pageSize };
  },

  async getById(context: WorkspaceActorContext, projectId: string) {
    const membership = await ProjectMemberRepository.findOne(
      { employeeId: context.employeeId, projectId },
      { companyId: context.companyId },
    );
    if (!membership) {
      return null;
    }

    const project = await ProjectRepository.findById(projectId, { companyId: context.companyId });
    if (!project) {
      return null;
    }

    const [tasks, milestones, sprints] = await Promise.all([
      TaskRepository.findMany({ projectId, assigneeId: context.employeeId }, { companyId: context.companyId }),
      MilestoneRepository.findMany({ projectId }, { companyId: context.companyId }),
      SprintRepository.findMany({ projectId }, { companyId: context.companyId }),
    ]);

    return {
      project: WorkspaceAuditService.toRecord(project),
      role: membership.role,
      myTasks: tasks.map(WorkspaceAuditService.toRecord),
      milestones: milestones.map(WorkspaceAuditService.toRecord),
      sprints: sprints.map(WorkspaceAuditService.toRecord),
    };
  },
};
