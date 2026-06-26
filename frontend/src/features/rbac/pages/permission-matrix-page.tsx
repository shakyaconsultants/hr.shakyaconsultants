import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAssignPermissions, usePermissionMatrix, useRole, useRoles } from '@/features/rbac/hooks/use-rbac';
import { PermissionTree } from '@/features/rbac/components/permission-tree';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';

export function PermissionMatrixPage() {
  const [searchParams] = useSearchParams();
  const roleIdFromQuery = searchParams.get('roleId') ?? '';
  const [selectedRoleId, setSelectedRoleId] = useState(roleIdFromQuery);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data, isLoading, isError } = usePermissionMatrix();
  const { data: roles } = useRoles({ pageSize: 100 });
  const { data: roleDetail } = useRole(selectedRoleId);
  const assignMutation = useAssignPermissions();

  useEffect(() => {
    if (roleDetail?.permissions) {
      setSelected(new Set(roleDetail.permissions));
    }
  }, [roleDetail?.permissions, selectedRoleId]);

  const permissions = useMemo(() => {
    if (!data?.permissions) return [];
    if (categoryFilter === 'all') return data.permissions;
    return data.permissions.filter((p) => p.category === categoryFilter);
  }, [categoryFilter, data?.permissions]);

  if (isLoading) return <Loading message="Loading permission matrix..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Permission Matrix" description="Assign permissions to roles with dependency-aware selection." />
      <Link to={ROUTES.RBAC} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Access Control
      </Link>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Target Role</span>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
            <option value="">— Select role —</option>
            {(roles?.items ?? []).map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </label>
        {selectedRoleId && hasPermission('rbac.role.update') ? (
          <Button onClick={() => void assignMutation.mutateAsync({ roleId: selectedRoleId, permissionCodes: Array.from(selected) })} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? 'Saving...' : 'Save to Role'}
          </Button>
        ) : null}
      </div>

      {isError && <p className="text-destructive">Failed to load permission matrix.</p>}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Categories</h2>
            <div className="flex flex-col gap-1">
              <Button variant={categoryFilter === 'all' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setCategoryFilter('all')}>All</Button>
              {data?.categories.map((c) => (
                <Button key={c.id} variant={categoryFilter === c.slug ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setCategoryFilter(c.slug)}>{c.name}</Button>
              ))}
            </div>
          </div>
        </aside>
        <section>
          <PermissionTree
            permissions={permissions}
            selected={selected}
            onToggle={(code) => setSelected((prev) => { const next = new Set(prev); if (next.has(code)) next.delete(code); else next.add(code); return next; })}
            onToggleGroup={(codes, select) => setSelected((prev) => { const next = new Set(prev); codes.forEach((c) => select ? next.add(c) : next.delete(c)); return next; })}
          />
        </section>
      </div>
    </div>
  );
}
