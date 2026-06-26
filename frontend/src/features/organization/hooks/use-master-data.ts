import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEntity,
  deleteEntity,
  listEntities,
  restoreEntity,
  updateEntity,
  type ListQueryParams,
  type MasterDataRecord,
} from '@/features/organization/api/organization.api';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';

function entityQueryKey(entityKey: MasterEntityKey, params: ListQueryParams) {
  return ['organization', entityKey, params] as const;
}

export function useMasterDataList(entityKey: MasterEntityKey, params: ListQueryParams, enabled = true) {
  return useQuery({
    queryKey: entityQueryKey(entityKey, params),
    queryFn: () => listEntities(entityKey, params),
    enabled,
  });
}

export function useCreateEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createEntity(entityKey, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization', entityKey] });
    },
  });
}

export function useUpdateEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateEntity(entityKey, id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['organization', entityKey] });
      const previous = queryClient.getQueriesData<{ items: MasterDataRecord[] }>({
        queryKey: ['organization', entityKey],
      });

      previous.forEach(([key, data]) => {
        if (!data) {
          return;
        }
        queryClient.setQueryData(key, {
          ...data,
          items: data.items.map((item) => (item.id === id ? { ...item, ...payload } : item)),
        });
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization', entityKey] });
    },
  });
}

export function useDeleteEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntity(entityKey, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization', entityKey] });
    },
  });
}

export function useRestoreEntity(entityKey: MasterEntityKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreEntity(entityKey, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization', entityKey] });
    },
  });
}
