import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export interface WorkspaceActorContext {
  companyId: string;
  userId: string;
  employeeId: string;
  ip?: string;
  userAgent?: string;
}

export interface WorkspaceListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MyTasksQuery extends WorkspaceListQuery {
  status?: string;
  projectId?: string;
  view?: 'kanban' | 'list' | 'calendar';
}

export interface NotificationQuery extends WorkspaceListQuery {
  isRead?: boolean;
  isArchived?: boolean;
  category?: string;
}

export interface CalendarQuery {
  startDate: string;
  endDate: string;
}

export interface SearchQuery {
  q: string;
  types?: string[];
  limit?: number;
}

export interface WidgetConfigInput {
  widgetSlug: string;
  sortOrder: number;
  isVisible: boolean;
  columnSpan?: number;
  config?: Record<string, unknown>;
}

export function buildWorkspaceActor(req: AuthenticatedRequest): WorkspaceActorContext {
  if (!req.user.employeeId) {
    throw new ValidationError('Employee profile must be linked to access workspace', undefined, { code: ERROR_CODES.AUTH_FORBIDDEN });
  }
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  };
}
