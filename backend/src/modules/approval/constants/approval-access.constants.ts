/** Permissions that allow company-wide approval oversight (ERP admin / HR), not only personal inbox. */
export const ENTERPRISE_APPROVAL_PERMISSIONS = [
  'approval.execute',
  'leave.approve',
] as const;

export const ENTERPRISE_APPROVAL_VIEW_PERMISSIONS = [
  'approval.read',
  ...ENTERPRISE_APPROVAL_PERMISSIONS,
] as const;
