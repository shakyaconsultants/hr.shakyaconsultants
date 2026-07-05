import type { ApprovalActorContext } from '@modules/approval/types/approval.types.js';
import { ENTERPRISE_APPROVAL_PERMISSIONS } from '@modules/approval/constants/approval-access.constants.js';

function permissionSet(context: ApprovalActorContext): Set<string> {
  return new Set(context.permissions ?? []);
}

/** Super Admin or HR/enterprise roles — may act on any pending approval in the company. */
export function canEnterpriseApprove(context: ApprovalActorContext): boolean {
  if (context.isSuperAdmin) {
    return true;
  }
  const permissions = permissionSet(context);
  return ENTERPRISE_APPROVAL_PERMISSIONS.some((code) => permissions.has(code));
}

/** May view company-wide approval queues (not only personal inbox). */
export function canViewCompanyApprovals(context: ApprovalActorContext): boolean {
  return canEnterpriseApprove(context);
}
