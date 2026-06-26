export interface ProjectActorContext {
  companyId: string;
  userId: string;
  employeeId?: string;
  ip?: string;
  userAgent?: string;
}

export interface ProjectListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  branchId?: string;
  projectManagerId?: string;
  includeArchived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  scope?: 'all' | 'assigned';
  visibleProjectIds?: string[];
}

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  projectId?: string;
  sprintId?: string;
  moduleId?: string;
  milestoneId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectDashboardData {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  upcomingDeadlines: { id: string; title: string; dueDate: string; projectId: string }[];
  recentActivity: { id: string; activityType: string; description: string; createdAt: Date }[];
  tasksByStatus: Record<string, number>;
}

export interface DeveloperDashboardData {
  assignedTasks: number;
  inProgressTasks: number;
  completedThisWeek: number;
  overdueTasks: number;
  upcomingDeadlines: { id: string; title: string; dueDate: string; projectId: string }[];
}

export interface ManagerDashboardData extends ProjectDashboardData {
  pendingVerifications: number;
  activeSprints: number;
  teamWorkload?: { employeeId: string; taskCount: number; allocationPercent: number }[];
}

export interface EnterpriseDashboardData extends ManagerDashboardData {
  projectsAtRisk: number;
  budgetSummary: { totalBudget: number; currency: string; projectCount: number };
  resourceAllocation: { employeeId: string; projectCount: number; totalAllocation: number }[];
  projectHealth: { healthy: number; atRisk: number; critical: number };
  recentProjects: { id: string; name: string; code: string; status: string; riskLevel: string; targetDate?: string }[];
}
