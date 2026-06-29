import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
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
  return useAppMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => cloneRole(id, name),
    successMessage: false,
    errorToast: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
    },
  });
}

export function useSimulator() {
  return useAppMutation({
    mutationFn: runSimulator,
  });
}

export function useCompareRoles() {
  return useAppMutation({
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
  return useAppMutation({
    mutationFn: createRole,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateRole>[1] }) => updateRole(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac'] }),
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ roleId, permissionCodes }: { roleId: string; permissionCodes: string[] }) =>
      assignPermissions(roleId, permissionCodes),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac'] }),
  });
}

export function useArchiveRole() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: archiveRole,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useRestoreRole() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: restoreRole,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteRole,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}
