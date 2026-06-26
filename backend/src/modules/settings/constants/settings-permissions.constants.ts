import { ORG_PERMISSIONS } from '@modules/organization/constants/organization-permissions.constants.js';

export const SETTINGS_PERMISSIONS = {
  READ: ORG_PERMISSIONS.SETTINGS_READ,
  MANAGE: ORG_PERMISSIONS.SETTINGS_MANAGE,
  SYSTEM_AUDIT_READ: 'system.audit.read',
  SYSTEM_CONFIG_READ: 'system.config.read',
} as const;
