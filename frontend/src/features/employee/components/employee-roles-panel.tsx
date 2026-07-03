import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, UserPlus, X } from 'lucide-react';
import {
  assignRoleToEmployee,
  fetchEmployeeRoles,
  fetchRoles,
  revokeRoleFromEmployee,
  type RoleRecord,
} from '@/features/rbac/api/rbac.api';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { useAuthStore } from '@/shared/stores/app.store';

interface EmployeeRolesPanelProps {
  employeeId: string;
}

export function EmployeeRolesPanel({ employeeId }: EmployeeRolesPanelProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('rbac.assignment.manage');
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rbac', 'employee-roles', employeeId],
    queryFn: () => fetchEmployeeRoles(employeeId),
    enabled: Boolean(employeeId),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['rbac', 'roles', 'all'],
    queryFn: () => fetchRoles({ pageSize: 100 }),
    enabled: canManage,
  });

  const assignMutation = useAppMutation({
    mutationFn: () => assignRoleToEmployee(employeeId, selectedRoleId),
    successMessage: 'Role assigned successfully',
    onSuccess: () => {
      setSelectedRoleId('');
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'employee-roles', employeeId] });
    },
  });

  const revokeMutation = useAppMutation({
    mutationFn: (roleId: string) => revokeRoleFromEmployee(employeeId, roleId),
    successMessage: 'Role removed',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rbac', 'employee-roles', employeeId] }),
  });

  const assignedRoleIds = useMemo(
    () => new Set((data?.roles ?? []).map((r: RoleRecord) => r.id)),
    [data?.roles],
  );

  const availableRoleOptions = useMemo(
    () =>
      (rolesData?.items ?? [])
        .filter((role) => !assignedRoleIds.has(role.id) && !role.isArchived)
        .map((role) => ({ value: role.id, label: role.name })),
    [rolesData?.items, assignedRoleIds],
  );

  if (isLoading) {
    return <Loading message="Loading roles..." />;
  }

  const roles = data?.roles ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Assigned Roles</h3>
        </div>
        {roles.length === 0 ? (
          <EmptyState title="No roles assigned" description="Assign a role to grant permissions to this employee." />
        ) : (
          <ul className="divide-y rounded-lg border">
            {roles.map((role: RoleRecord) => (
              <li key={role.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.slug}</p>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revokeMutation.isPending}
                    onClick={() => void revokeMutation.mutateAsync(role.id)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage ? (
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Assign Role</h3>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <AsyncSearchSelect
                value={selectedRoleId}
                options={availableRoleOptions}
                placeholder="Select role to assign…"
                onChange={setSelectedRoleId}
              />
            </div>
            <Button
              disabled={!selectedRoleId || assignMutation.isPending}
              onClick={() => void assignMutation.mutateAsync()}
            >
              Assign Role
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
