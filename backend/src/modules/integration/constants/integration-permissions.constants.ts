import { SETTINGS_PERMISSIONS } from '@modules/settings/constants/settings-permissions.constants.js';

export const INTEGRATION_PERMISSIONS = {
  READ: SETTINGS_PERMISSIONS.SYSTEM_CONFIG_READ,
  MANAGE: 'system.config.manage',
  SETTINGS_MANAGE: SETTINGS_PERMISSIONS.MANAGE,
} as const;
