import { EmployeeRepository, ReportingHierarchyRepository } from '@domain/employee/employee.schemas.js';
import { REPORTING_RELATIONSHIP_TYPE } from '@domain/employee/employee.schemas.js';
import { AnnouncementRepository, NotificationRepository, ANNOUNCEMENT_AUDIENCE } from '@domain/communication/communication.schemas.js';
import { WORKSPACE_WIDGET } from '@domain/workspace/workspace-extended.schemas.js';
import { TaskRepository, ProjectRepository, ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { WORKSPACE_QUICK_LINKS } from '@modules/workspace/constants/workspace.constants.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import type { WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function getEmployeeContext(companyId: string, employeeId: string) {
  const employee = await EmployeeRepository.findById(employeeId, { companyId });
  if (!employee) {
    return null;
  }
  return employee;
}

async function getMyProjectIds(companyId: string, employeeId: string): Promise<string[]> {
  const memberships = await ProjectMemberRepository.findMany({ employeeId }, { companyId });
  return memberships.map((m) => m.projectId);
}

export const WorkspaceWidgetDataService = {
  async load(context: WorkspaceActorContext, slug: string): Promise<Record<string, unknown>> {
    switch (slug) {
      case WORKSPACE_WIDGET.TODAY_TASKS:
        return this.getTodayTasks(context);
      case WORKSPACE_WIDGET.MY_PROJECTS:
        return this.getMyProjects(context);
      case WORKSPACE_WIDGET.PROJECT_PROGRESS:
        return this.getProjectProgress(context);
      case WORKSPACE_WIDGET.UPCOMING_DEADLINES:
        return this.getUpcomingDeadlines(context);
      case WORKSPACE_WIDGET.RECENT_NOTIFICATIONS:
        return this.getRecentNotifications(context);
      case WORKSPACE_WIDGET.RECENT_ACTIVITIES:
        return this.getRecentActivities(context);
      case WORKSPACE_WIDGET.ATTENDANCE_SUMMARY:
        return { placeholder: true, message: 'Attendance module coming soon', summary: null };
      case WORKSPACE_WIDGET.LEAVE_BALANCE:
        return { placeholder: true, message: 'Leave balance coming soon', balances: [] };
      case WORKSPACE_WIDGET.PAYSLIPS:
        return { placeholder: true, message: 'Payslips coming soon', payslips: [] };
      case WORKSPACE_WIDGET.ANNOUNCEMENTS:
        return this.getAnnouncements(context);
      case WORKSPACE_WIDGET.QUICK_LINKS:
        return { links: WORKSPACE_QUICK_LINKS };
      case WORKSPACE_WIDGET.UPCOMING_BIRTHDAYS:
        return this.getUpcomingBirthdays(context);
      case WORKSPACE_WIDGET.WORK_ANNIVERSARIES:
        return this.getWorkAnniversaries(context);
      case WORKSPACE_WIDGET.MANAGER_MESSAGES:
        return this.getManagerMessages(context);
      default:
        return { error: 'Unknown widget' };
    }
  },

  async getTodayTasks(context: WorkspaceActorContext) {
    const today = new Date();
    const tasks = await TaskRepository.findMany(
      {
        assigneeId: context.employeeId,
        status: { $nin: [PROJECT_TASK_STATUS.CLOSED, PROJECT_TASK_STATUS.CANCELLED, PROJECT_TASK_STATUS.VERIFIED] },
      },
      { companyId: context.companyId },
    );

    const todayTasks = tasks.filter((t) => {
      if (!t.dueDate) {
        return t.status === PROJECT_TASK_STATUS.IN_PROGRESS || t.status === PROJECT_TASK_STATUS.ASSIGNED;
      }
      const due = new Date(t.dueDate);
      return due >= startOfDay(today) && due <= endOfDay(today);
    });

    return {
      tasks: todayTasks.slice(0, 10).map(WorkspaceAuditService.toRecord),
      total: todayTasks.length,
    };
  },

  async getMyProjects(context: WorkspaceActorContext) {
    const memberships = await ProjectMemberRepository.findMany({ employeeId: context.employeeId }, { companyId: context.companyId });
    const projectIds = memberships.map((m) => m.projectId);
    if (projectIds.length === 0) {
      return { projects: [], total: 0 };
    }

    const projects = await ProjectRepository.findMany(
      { id: { $in: projectIds }, isArchived: false },
      { companyId: context.companyId },
    );

    const enriched = memberships.slice(0, 6).map((membership) => {
      const project = projects.find((p) => p.id === membership.projectId);
      return {
        ...WorkspaceAuditService.toRecord(membership),
        project: project ? WorkspaceAuditService.toRecord(project) : null,
      };
    });

    return { projects: enriched, total: memberships.length };
  },

  async getProjectProgress(context: WorkspaceActorContext) {
    const projectIds = await getMyProjectIds(context.companyId, context.employeeId);
    if (projectIds.length === 0) {
      return { items: [], averageProgress: 0 };
    }

    const tasks = await TaskRepository.findMany({ projectId: { $in: projectIds } }, { companyId: context.companyId });
    const projects = await ProjectRepository.findMany({ id: { $in: projectIds } }, { companyId: context.companyId });

    const items = projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const completed = projectTasks.filter((t) =>
        [PROJECT_TASK_STATUS.COMPLETED, PROJECT_TASK_STATUS.VERIFIED, PROJECT_TASK_STATUS.CLOSED].includes(t.status as typeof PROJECT_TASK_STATUS.COMPLETED),
      ).length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      return { projectId: project.id, name: project.name, code: project.code, progress, totalTasks: projectTasks.length, completedTasks: completed };
    });

    const averageProgress = items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
      : 0;

    return { items, averageProgress };
  },

  async getUpcomingDeadlines(context: WorkspaceActorContext) {
    const now = new Date();
    const horizon = addDays(now, 14);
    const tasks = await TaskRepository.findMany(
      {
        assigneeId: context.employeeId,
        dueDate: { $gte: now, $lte: horizon },
        status: { $nin: [PROJECT_TASK_STATUS.CLOSED, PROJECT_TASK_STATUS.CANCELLED, PROJECT_TASK_STATUS.VERIFIED] },
      },
      { companyId: context.companyId },
    );

    const sorted = tasks.sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return aTime - bTime;
    });
    return { deadlines: sorted.slice(0, 10).map(WorkspaceAuditService.toRecord), total: sorted.length };
  },

  async getRecentNotifications(context: WorkspaceActorContext) {
    const notifications = await NotificationRepository.findMany(
      { recipientId: context.userId, isArchived: false },
      { companyId: context.companyId },
    );
    const sorted = notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { notifications: sorted.slice(0, 8).map(WorkspaceAuditService.toRecord), unreadCount: sorted.filter((n) => !n.readAt).length };
  },

  async getRecentActivities(context: WorkspaceActorContext) {
    const activities = await ActivityLogRepository.findMany(
      { userId: context.userId },
      { companyId: context.companyId },
    );
    const sorted = activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { activities: sorted.slice(0, 8).map(WorkspaceAuditService.toRecord) };
  },

  async getAnnouncements(context: WorkspaceActorContext) {
    const employee = await getEmployeeContext(context.companyId, context.employeeId);
    if (!employee) {
      return { announcements: [] };
    }

    const all = await AnnouncementRepository.findMany(
      { status: ENTITY_STATUS.ACTIVE },
      { companyId: context.companyId },
    );

    const now = new Date();
    const filtered = all.filter((a) => {
      if (a.expiresAt && new Date(a.expiresAt) < now) {
        return false;
      }
      if (a.targetAudience === ANNOUNCEMENT_AUDIENCE.ALL) {
        return true;
      }
      if (a.targetAudience === ANNOUNCEMENT_AUDIENCE.DEPARTMENT) {
        return a.targetIds.includes(employee.departmentId);
      }
      if (a.targetAudience === ANNOUNCEMENT_AUDIENCE.BRANCH && employee.branchId) {
        return a.targetIds.includes(employee.branchId);
      }
      return false;
    });

    const sorted = filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return (b.publishedAt?.getTime() ?? b.createdAt.getTime()) - (a.publishedAt?.getTime() ?? a.createdAt.getTime());
    });

    return { announcements: sorted.slice(0, 5).map(WorkspaceAuditService.toRecord) };
  },

  async getUpcomingBirthdays(context: WorkspaceActorContext) {
    const employees = await EmployeeRepository.findMany(
      { status: ENTITY_STATUS.ACTIVE, dateOfBirth: { $exists: true, $ne: null } },
      { companyId: context.companyId },
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const upcoming = employees
      .filter((e) => e.dateOfBirth && new Date(e.dateOfBirth).getMonth() === currentMonth)
      .map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        dateOfBirth: e.dateOfBirth,
        photoUrl: e.photoUrl,
      }))
      .slice(0, 10);

    return { birthdays: upcoming };
  },

  async getWorkAnniversaries(context: WorkspaceActorContext) {
    const employees = await EmployeeRepository.findMany(
      { status: ENTITY_STATUS.ACTIVE },
      { companyId: context.companyId },
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const anniversaries = employees
      .filter((e) => new Date(e.joinedAt).getMonth() === currentMonth)
      .map((e) => {
        const years = now.getFullYear() - new Date(e.joinedAt).getFullYear();
        return {
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          joinedAt: e.joinedAt,
          years,
          photoUrl: e.photoUrl,
        };
      })
      .filter((e) => e.years > 0)
      .slice(0, 10);

    return { anniversaries };
  },

  async getManagerMessages(context: WorkspaceActorContext) {
    const hierarchy = await ReportingHierarchyRepository.findMany(
      {
        employeeId: context.employeeId,
        relationshipType: REPORTING_RELATIONSHIP_TYPE.DIRECT,
        $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
      },
      { companyId: context.companyId },
    );

    const managerIds = hierarchy.map((h) => h.managerId);
    if (managerIds.length === 0) {
      return { messages: [], manager: null };
    }

    const primaryManagerId = hierarchy.find((h) => h.isPrimary)?.managerId ?? managerIds[0];
    const manager = await EmployeeRepository.findById(primaryManagerId, { companyId: context.companyId });

    const notifications = await NotificationRepository.findMany(
      { recipientId: context.userId, category: 'manager_message', isArchived: false },
      { companyId: context.companyId },
    );

    return {
      manager: manager ? { id: manager.id, firstName: manager.firstName, lastName: manager.lastName, photoUrl: manager.photoUrl } : null,
      messages: notifications.slice(0, 5).map(WorkspaceAuditService.toRecord),
    };
  },
};
