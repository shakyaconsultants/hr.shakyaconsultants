import { getEnv } from '@config/env.js';

export interface SuperAdminSeedProfile {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export function parseSuperAdminFromEnv(): SuperAdminSeedProfile {
  const env = getEnv();
  const trimmed = env.SUPER_ADMIN_NAME.trim();
  const spaceIndex = trimmed.indexOf(' ');
  const firstName = spaceIndex > 0 ? trimmed.slice(0, spaceIndex) : trimmed;
  const lastName = spaceIndex > 0 ? trimmed.slice(spaceIndex + 1).trim() || 'Admin' : 'Admin';

  return {
    firstName,
    lastName,
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    ...(env.SUPER_ADMIN_PHONE ? { phone: env.SUPER_ADMIN_PHONE } : {}),
  };
}
