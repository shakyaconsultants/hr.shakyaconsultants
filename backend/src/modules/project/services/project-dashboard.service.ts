import { ProjectRepository } from '@domain/project/project.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { SprintRepository, SPRINT_STATUS } from '@domain/project/project.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { TaskVerificationRepository, VERIFICATION_STATUS, PROJECT_RISK_LEVEL } from '@domain/project/project-extended.schemas.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import type { ProjectDashboardData, DeveloperDashboardData, ManagerDashboardData, EnterpriseDashboardData } from '@modules/project/types/project.types.js';

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

  async getManagerDashboard(companyId: string, projectIds?: string[]): Promise<ManagerDashboardData> {
    const projectFilter = projectIds && projectIds.length > 0 ? { id: { $in: projectIds }, isArchived: false } : { isArchived: false };
    const projects = await ProjectRepository.findMany(projectFilter, { companyId });
    const scopedProjectIds = projects.map((p) => p.id);

    const taskFilter = scopedProjectIds.length > 0 ? { projectId: { $in: scopedProjectIds } } : {};
    const [tasks, pendingVerifications, activeSprints, members] = await Promise.all([
      TaskRepository.findMany(taskFilter, { companyId }),
      TaskVerificationRepository.findMany({ status: VERIFICATION_STATUS.PENDING }, { companyId }),
      SprintRepository.findMany({ status: SPRINT_STATUS.ACTIVE, ...(scopedProjectIds.length > 0 ? { projectId: { $in: scopedProjectIds } } : {}) }, { companyId }),
      ProjectMemberRepository.findMany(scopedProjectIds.length > 0 ? { projectId: { $in: scopedProjectIds } } : {}, { companyId }),
    ]);

    const base = await this.buildDashboardFromData(projects, tasks, companyId);

    const teamWorkload = this.buildTeamWorkload(members, tasks);

    return {
      ...base,
      pendingVerifications: pendingVerifications.filter((v) => scopedProjectIds.length === 0 || scopedProjectIds.includes(v.projectId)).length,
      activeSprints: activeSprints.length,
      teamWorkload,
    };
  },

  async getEnterpriseDashboard(companyId: string): Promise<EnterpriseDashboardData> {
    const [base, projects, members] = await Promise.all([
      this.getManagerDashboard(companyId),
      ProjectRepository.findMany({ isArchived: false }, { companyId }),
      ProjectMemberRepository.findMany({}, { companyId }),
    ]);

    const now = new Date();
    const projectsAtRisk = projects.filter((p) =>
      p.riskLevel === PROJECT_RISK_LEVEL.HIGH
      || p.riskLevel === PROJECT_RISK_LEVEL.CRITICAL
      || (p.targetDate && p.targetDate < now && p.status !== PROJECT_STATUS.COMPLETED),
    ).length;

    const budgetSummary = {
      totalBudget: projects.reduce((sum, p) => sum + (p.budget ?? 0), 0),
      currency: projects[0]?.currency ?? 'INR',
      projectCount: projects.length,
    };

    const allocationMap = new Map<string, { projectCount: number; totalAllocation: number }>();
    for (const member of members.filter((m) => !m.leftAt)) {
      const current = allocationMap.get(member.employeeId) ?? { projectCount: 0, totalAllocation: 0 };
      allocationMap.set(member.employeeId, {
        projectCount: current.projectCount + 1,
        totalAllocation: current.totalAllocation + member.allocationPercent,
      });
    }

    const resourceAllocation = [...allocationMap.entries()]
      .map(([employeeId, stats]) => ({ employeeId, ...stats }))
      .sort((a, b) => b.totalAllocation - a.totalAllocation)
      .slice(0, 20);

    const projectHealth = {
      healthy: projects.filter((p) => p.riskLevel === PROJECT_RISK_LEVEL.LOW).length,
      atRisk: projects.filter((p) => p.riskLevel === PROJECT_RISK_LEVEL.MEDIUM || p.riskLevel === PROJECT_RISK_LEVEL.HIGH).length,
      critical: projects.filter((p) => p.riskLevel === PROJECT_RISK_LEVEL.CRITICAL).length,
    };

    const recentProjects = projects
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        riskLevel: p.riskLevel,
        targetDate: p.targetDate?.toISOString(),
      }));

    return {
      ...base,
      projectsAtRisk,
      budgetSummary,
      resourceAllocation,
      projectHealth,
      recentProjects,
    };
  },

  buildTeamWorkload(
    members: { employeeId: string; leftAt?: Date; allocationPercent: number }[],
    tasks: { assigneeId?: string; status: string }[],
  ) {
    const activeMembers = members.filter((m) => !m.leftAt);
    const workloadMap = new Map<string, { taskCount: number; allocationPercent: number }>();

    for (const member of activeMembers) {
      const current = workloadMap.get(member.employeeId) ?? { taskCount: 0, allocationPercent: 0 };
      workloadMap.set(member.employeeId, {
        taskCount: current.taskCount,
        allocationPercent: current.allocationPercent + member.allocationPercent,
      });
    }

    for (const task of tasks) {
      if (!task.assigneeId || task.status === PROJECT_TASK_STATUS.CLOSED) {
        continue;
      }
      const current = workloadMap.get(task.assigneeId) ?? { taskCount: 0, allocationPercent: 0 };
      workloadMap.set(task.assigneeId, { ...current, taskCount: current.taskCount + 1 });
    }

    return [...workloadMap.entries()]
      .map(([employeeId, stats]) => ({ employeeId, ...stats }))
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 15);
  },

  async buildDashboardFromData(
    projects: Awaited<ReturnType<typeof ProjectRepository.findMany>>,
    tasks: Awaited<ReturnType<typeof TaskRepository.findMany>>,
    companyId: string,
  ): Promise<ProjectDashboardData> {
    const activities = await ActivityLogRepository.findMany({}, { companyId });
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
};
