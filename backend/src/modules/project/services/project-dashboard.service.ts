import { ProjectRepository } from '@domain/project/project.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { SprintRepository, SPRINT_STATUS } from '@domain/project/project.schemas.js';
import { TaskVerificationRepository, VERIFICATION_STATUS } from '@domain/project/project-extended.schemas.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import type { ProjectDashboardData, DeveloperDashboardData, ManagerDashboardData } from '@modules/project/types/project.types.js';

const COMPLETED_STATUSES = new Set<string>(['completed', 'verified', 'closed']);

export const ProjectDashboardService = {
  async getProjectDashboard(companyId: string, projectId?: string): Promise<ProjectDashboardData> {
    const projectFilter = projectId ? { id: projectId } : { isArchived: false };
    const taskFilter = projectId ? { projectId } : {};

    const [projects, tasks, activities] = await Promise.all([
      ProjectRepository.findMany(projectFilter, { companyId }),
      TaskRepository.findMany(taskFilter, { companyId }),
      ActivityLogRepository.findMany({}, { companyId }),
    ]);

    const now = new Date();
    const tasksByStatus: Record<string, number> = {};
    for (const status of Object.values(PROJECT_TASK_STATUS)) {
      tasksByStatus[status] = tasks.filter((t) => t.status === status).length;
    }

    const blockedTasks = tasks.filter((t) => t.status === PROJECT_TASK_STATUS.BLOCKED).length;
    const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== PROJECT_TASK_STATUS.CLOSED).length;

    const upcomingDeadlines = tasks
      .filter((t) => t.dueDate && t.dueDate >= now)
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() ?? '',
        projectId: t.projectId,
      }));

    const recentActivity = activities
      .filter((a) => a.activityType.startsWith('project.') || a.activityType.startsWith('task.') || a.activityType.startsWith('sprint.') || a.activityType.startsWith('milestone.'))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        activityType: a.activityType,
        description: a.description,
        createdAt: a.createdAt,
      }));

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE).length,
      totalTasks: tasks.length,
      blockedTasks,
      overdueTasks,
      upcomingDeadlines,
      recentActivity,
      tasksByStatus,
    };
  },

  async getDeveloperDashboard(companyId: string, employeeId: string): Promise<DeveloperDashboardData> {
    const tasks = await TaskRepository.findMany({ assigneeId: employeeId }, { companyId });
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    return {
      assignedTasks: tasks.length,
      inProgressTasks: tasks.filter((t) => t.status === PROJECT_TASK_STATUS.IN_PROGRESS).length,
      completedThisWeek: tasks.filter((t) =>
        COMPLETED_STATUSES.has(t.status) && t.updatedAt >= weekStart,
      ).length,
      overdueTasks: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== PROJECT_TASK_STATUS.CLOSED).length,
      upcomingDeadlines: tasks
        .filter((t) => t.dueDate && t.dueDate >= now)
        .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
        .slice(0, 10)
        .map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate?.toISOString() ?? '',
          projectId: t.projectId,
        })),
    };
  },

  async getManagerDashboard(companyId: string): Promise<ManagerDashboardData> {
    const [base, pendingVerifications, activeSprints] = await Promise.all([
      this.getProjectDashboard(companyId),
      TaskVerificationRepository.findMany({ status: VERIFICATION_STATUS.PENDING }, { companyId }),
      SprintRepository.findMany({ status: SPRINT_STATUS.ACTIVE }, { companyId }),
    ]);

    return {
      ...base,
      pendingVerifications: pendingVerifications.length,
      activeSprints: activeSprints.length,
    };
  },
};
