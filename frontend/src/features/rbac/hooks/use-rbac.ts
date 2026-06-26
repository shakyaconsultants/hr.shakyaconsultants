import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveRole,
  assignPermissions,
  cloneRole,
  compareRoles,
  createRole,
  deleteRole,
  fetchPermissionMatrix,
  fetchPermissions,
  fetchRole,
  fetchRoleTemplates,
  fetchRoles,
  restoreRole,
  runSimulator,
  updateRole,
} from '@/features/rbac/api/rbac.api';

export function useRoles(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['rbac', 'roles', params],
    queryFn: () => fetchRoles(params),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ['rbac', 'role', id],
    queryFn: () => fetchRole(id),
    enabled: Boolean(id),
  });
}

export function usePermissionMatrix() {
  return useQuery({
    queryKey: ['rbac', 'matrix'],
    queryFn: fetchPermissionMatrix,
  });
}

export function usePermissions(search?: string) {
  return useQuery({
    queryKey: ['rbac', 'permissions', search],
    queryFn: () => fetchPermissions({ search, pageSize: 200 }),
  });
}

export function useCloneRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => cloneRole(id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
    },
  });
}

export function useSimulator() {
  return useMutation({
    mutationFn: runSimulator,
  });
}

export function useCompareRoles() {
  return useMutation({
    mutationFn: ({ roleIdA, roleIdB }: { roleIdA: string; roleIdB: string }) => compareRoles(roleIdA, roleIdB),
  });
}

export function useRoleTemplates() {
  return useQuery({
    queryKey: ['rbac', 'role-templates'],
    queryFn: fetchRoleTemplates,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateRole>[1] }) => updateRole(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac'] }),
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionCodes }: { roleId: string; permissionCodes: string[] }) =>
      assignPermissions(roleId, permissionCodes),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac'] }),
  });
}

export function useArchiveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveRole,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useRestoreRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreRole,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}
