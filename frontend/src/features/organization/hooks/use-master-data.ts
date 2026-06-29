import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  createEntity,
  deleteEntity,
  getEntity,
  listEntities,
  restoreEntity,
  updateEntity,
  type ListQueryParams,
} from '@/features/organization/api/organization.api';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { clampMasterDataListParams } from '@/features/organization/constants/master-data.constants';
import { departmentQueryKeys } from '@/features/organization/departments/department-query-keys';
import { MASTER_DATA_QUERY_OPTIONS } from '@/shared/api/query-config';
import { queryKeys } from '@/shared/api/query-keys';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { useAuthStore } from '@/shared/stores/app.store';
import { isValidEntityId } from '@/shared/utils/entity-id.util';

export function masterDataListQueryKey(entityKey: MasterEntityKey, params: ListQueryParams) {
  return ['organization', entityKey, clampMasterDataListParams(params)] as const;
}

/** Invalidate all cached master-data reads for one entity (lists, detail, stats). */
export function invalidateMasterDataQueries(queryClient: QueryClient, entityKey: MasterEntityKey) {
  void queryClient.invalidateQueries({ queryKey: ['organization', entityKey] });
  if (entityKey === 'department') {
    void queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all });
  }
}

/** Invalidate every organization master-data query (e.g. setup wizard bulk creates). */
export function invalidateAllMasterDataQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['organization'] });
}

export function useMasterDataList(entityKey: MasterEntityKey, params: ListQueryParams, enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.authStatus === AUTH_STATUS.AUTHENTICATED);
  const safeParams = clampMasterDataListParams(params);

  return useQuery({
    queryKey: masterDataListQueryKey(entityKey, safeParams),
    queryFn: () => listEntities(entityKey, safeParams),
    enabled: enabled && isAuthenticated,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

/** Fetch a single master-data record by id (dropdown label hydration, detail views). */
export function useMasterDataEntity(entityKey: MasterEntityKey, id: string, enabled = true) {
  const isAuthenticated = useAuthStore((state) => state.authStatus === AUTH_STATUS.AUTHENTICATED);
  const canFetch = enabled && isAuthenticated && isValidEntityId(id);

  return useQuery({
    queryKey: queryKeys.organization.entityDetail(entityKey, isValidEntityId(id) ? id : 'invalid'),
    queryFn: () => getEntity(entityKey, id),
    enabled: canFetch,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function useCreateEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: Record<string, unknown>) => createEntity(entityKey, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      invalidateMasterDataQueries(queryClient, entityKey);
    },
  });
}

export function useUpdateEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      if (!isValidEntityId(id)) {
        return Promise.reject(new Error('Cannot update: record id is missing or invalid'));
      }
      return updateEntity(entityKey, id, payload);
    },
    onSuccess: () => {
      invalidateMasterDataQueries(queryClient, entityKey);
    },
    errorToast: false,
    successMessage: false,
  });
}

export function useDeleteEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => {
      if (!isValidEntityId(id)) {
        return Promise.reject(new Error('Cannot delete: record id is missing or invalid'));
      }
      return deleteEntity(entityKey, id);
    },
    onSuccess: () => {
      invalidateMasterDataQueries(queryClient, entityKey);
    },
    errorToast: false,
    successMessage: false,
  });
}

export function useRestoreEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => {
      if (!isValidEntityId(id)) {
        return Promise.reject(new Error('Cannot restore: record id is missing or invalid'));
      }
      return restoreEntity(entityKey, id);
    },
    onSuccess: () => {
      invalidateMasterDataQueries(queryClient, entityKey);
    },
    errorToast: false,
    successMessage: false,
  });
}
