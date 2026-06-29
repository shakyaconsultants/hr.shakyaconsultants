import { ROUTES } from '@/config/app.config';
import { PORTAL, type PortalType } from '@/config/portals';

type PermissionCheck = (code: string) => boolean;

/** Resolve attendance landing route from authenticated portal — never infer from employee record. */
export function resolveAttendanceHubRoute(portal: PortalType, hasPermission: PermissionCheck): string {
  if (portal === PORTAL.ENTERPRISE) {
    if (hasPermission('attendance.update')) {
      return ROUTES.ATTENDANCE_ADMIN;
    }
    if (hasPermission('attendance.approve')) {
      return ROUTES.ATTENDANCE_HR;
    }
    if (hasPermission('attendance.read')) {
      return ROUTES.ATTENDANCE_REPORTS;
    }
    return ROUTES.FORBIDDEN;
  }

  if (portal === PORTAL.MANAGER) {
    if (hasPermission('attendance.read')) {
      return ROUTES.ATTENDANCE_TEAM;
    }
    return ROUTES.FORBIDDEN;
  }

  if (hasPermission('attendance.read')) {
    return ROUTES.WORKSPACE_ATTENDANCE;
  }
  return ROUTES.FORBIDDEN;
}

/** Resolve payroll landing route from authenticated portal. */
export function resolvePayrollHubRoute(portal: PortalType, hasPermission: PermissionCheck): string {
  if (portal === PORTAL.ENTERPRISE) {
    if (hasPermission('payroll.update')) {
      return ROUTES.PAYROLL_ADMIN;
    }
    if (hasPermission('payroll.read')) {
      return ROUTES.PAYROLL_HR;
    }
    return ROUTES.FORBIDDEN;
  }

  if (portal === PORTAL.MANAGER) {
    if (hasPermission('payroll.process')) {
      return ROUTES.PAYROLL_FINANCE;
    }
    return ROUTES.FORBIDDEN;
  }

  if (hasPermission('payroll.read')) {
    return ROUTES.WORKSPACE_PAYROLL;
  }
  return ROUTES.FORBIDDEN;
}

/** Resolve sales landing route from authenticated portal. */
export function resolveSalesHubRoute(portal: PortalType, hasPermission: PermissionCheck): string {
  if (hasPermission('pipeline.update')) {
    return ROUTES.SALES_ADMIN;
  }
  if (!hasPermission('lead.read')) {
    return ROUTES.FORBIDDEN;
  }
  if (portal === PORTAL.ENTERPRISE) {
    return ROUTES.SALES_REPORTS;
  }
  if (portal === PORTAL.MANAGER) {
    return ROUTES.SALES_MANAGER;
  }
  return ROUTES.SALES_EXECUTIVE;
}

/** Resolve communication landing route from authenticated portal. */
export function resolveCommunicationHubRoute(portal: PortalType, hasPermission: PermissionCheck): string {
  if (hasPermission('notifications.broadcast')) {
    return ROUTES.COMMUNICATION_ADMIN;
  }

  if (portal === PORTAL.ENTERPRISE) {
    if (hasPermission('notification.read')) {
      return ROUTES.COMMUNICATION_REPORTS;
    }
    return ROUTES.FORBIDDEN;
  }

  if (portal === PORTAL.MANAGER) {
    if (hasPermission('conversation.read')) {
      return ROUTES.COMMUNICATION_MANAGER;
    }
    return ROUTES.FORBIDDEN;
  }

  if (hasPermission('chat.message.send') || hasPermission('conversation.read')) {
    return ROUTES.WORKSPACE_MESSAGES;
  }
  return ROUTES.FORBIDDEN;
}
