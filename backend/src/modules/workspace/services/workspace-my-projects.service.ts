import {
  ProjectMemberRepository,
  ProjectRepository,
  MilestoneRepository,
  SprintRepository,
  TaskRepository,
} from '@domain/project/project.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { ProjectAccessService } from '@modules/project/services/project-access.service.js';
import { KnowledgeBaseService } from '@modules/project/services/knowledge-base.service.js';
import { ProjectMemberService } from '@modules/project/services/project-member.service.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import type {
  WorkspaceActorContext,
  WorkspaceListQuery,
} from '@modules/workspace/types/workspace.types.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

function toProjectActor(context: WorkspaceActorContext): ProjectActorContext {
  return {
    companyId: context.companyId,
    userId: context.userId,
    employeeId: context.employeeId,
    ip: context.ip,
    userAgent: context.userAgent,
  };
}

const COMPLETED_STATUSES = new Set<string>([
  PROJECT_TASK_STATUS.COMPLETED,
  PROJECT_TASK_STATUS.VERIFIED,
  PROJECT_TASK_STATUS.CLOSED,
]);

export const WorkspaceMyProjectsService = {
  async list(context: WorkspaceActorContext, query: WorkspaceListQuery) {
    const projectIds = await ProjectAccessService.resolveAssignedProjectIds(
      toProjectActor(context),
    );

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

    const memberships = await ProjectMemberRepository.findMany(
      { employeeId: context.employeeId, projectId: { $in: projectIds } },
      { companyId: context.companyId },
    );

    const [tasks, milestones, sprints] = await Promise.all([
      TaskRepository.findMany({ projectId: { $in: projectIds } }, { companyId: context.companyId }),
      MilestoneRepository.findMany(
        { projectId: { $in: projectIds } },
        { companyId: context.companyId },
      ),
      SprintRepository.findMany(
        { projectId: { $in: projectIds } },
        { companyId: context.companyId },
      ),
    ]);

    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const items = projects.map((project) => {
      const membership = memberships.find((m) => m.projectId === project.id && !m.leftAt);
      const role =
        membership?.role ??
        (project.projectManagerId === context.employeeId ? 'project_manager' : 'member');
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const myTasks = projectTasks.filter((t) => t.assigneeId === context.employeeId);
      const completed = projectTasks.filter((t) => COMPLETED_STATUSES.has(t.status)).length;
      const progress =
        projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      const upcomingDeadlines = myTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= horizon)
        .sort((a, b) => {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return aDate - bDate;
        })
        .slice(0, 5);

      return {
        project: WorkspaceAuditService.toRecord(project),
        role,
        progress,
        totalTasks: projectTasks.length,
        myTaskCount: myTasks.length,
        completedTasks: completed,
        upcomingDeadlines: upcomingDeadlines.map(WorkspaceAuditService.toRecord),
        milestones: milestones
          .filter((m) => m.projectId === project.id)
          .map(WorkspaceAuditService.toRecord),
        sprints: sprints
          .filter((s) => s.projectId === project.id)
          .map(WorkspaceAuditService.toRecord),
      };
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return { items: paged, total: items.length, page, pageSize };
  },

  async getById(context: WorkspaceActorContext, projectId: string) {
    const assignedIds = await ProjectAccessService.resolveAssignedProjectIds(
      toProjectActor(context),
    );
    if (!assignedIds.includes(projectId)) {
      return null;
    }

    const project = await ProjectRepository.findById(projectId, { companyId: context.companyId });
    if (!project || project.isArchived) {
      return null;
    }

    const membership = await ProjectMemberRepository.findOne(
      { employeeId: context.employeeId, projectId },
      { companyId: context.companyId },
    );

    const role =
      membership && !membership.leftAt
        ? membership.role
        : project.projectManagerId === context.employeeId
          ? 'project_manager'
          : 'member';

    const [myTasks, milestones, sprints, members, knowledgeBase] = await Promise.all([
      TaskRepository.findMany(
        { projectId, assigneeId: context.employeeId },
        { companyId: context.companyId },
      ),
      MilestoneRepository.findMany({ projectId }, { companyId: context.companyId }),
      SprintRepository.findMany({ projectId }, { companyId: context.companyId }),
      ProjectMemberService.list(context.companyId, projectId),
      KnowledgeBaseService.get(context.companyId, projectId),
    ]);

    return {
      project: WorkspaceAuditService.toRecord(project),
      role,
      canManage: project.projectManagerId === context.employeeId,
      myTasks: myTasks.map(WorkspaceAuditService.toRecord),
      milestones: milestones.map(WorkspaceAuditService.toRecord),
      sprints: sprints.map(WorkspaceAuditService.toRecord),
      members,
      knowledgeBase,
    };
  },
};
