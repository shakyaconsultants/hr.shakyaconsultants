import { getEnv } from '@config/env.js';
import { MasterDataCacheService } from '@modules/organization/shared/master-data-cache.service.js';
import { AUTH_CACHE_KEY_PREFIX } from '@modules/auth/constants/auth.constants.js';

const PERMISSIONS_CACHE_ENTITY = 'user-permissions';

export const PermissionCacheService = {
  buildKey(companyId: string, employeeId: string): string {
    const env = getEnv();
    return `${env.CACHE_PREFIX}:${companyId}:${AUTH_CACHE_KEY_PREFIX.PERMISSIONS}:${employeeId}`;
  },

  async get(companyId: string, employeeId: string): Promise<string[] | null> {
    const key = this.buildKey(companyId, employeeId);
    return MasterDataCacheService.getJson<string[]>(key);
  },

  async set(companyId: string, employeeId: string, permissions: string[]): Promise<void> {
    const env = getEnv();
    const key = this.buildKey(companyId, employeeId);
    await MasterDataCacheService.setJson(key, permissions, env.AUTH_PERMISSION_CACHE_TTL_SECONDS);
  },

  async invalidate(companyId: string, employeeId: string): Promise<void> {
    const key = this.buildKey(companyId, employeeId);
    await MasterDataCacheService.del(key);
  },

  async invalidateCompany(companyId: string): Promise<void> {
    await MasterDataCacheService.invalidateEntity(companyId, PERMISSIONS_CACHE_ENTITY);
  },

  async invalidateRoleAssignees(
    companyId: string,
    roleId: string,
    employeeIds: string[],
  ): Promise<void> {
    await Promise.all(employeeIds.map((employeeId) => this.invalidate(companyId, employeeId)));
    void roleId;
  },
};
