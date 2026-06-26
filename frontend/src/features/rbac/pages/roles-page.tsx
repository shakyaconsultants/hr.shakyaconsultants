import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, Plus, Shield } from 'lucide-react';
import {
  useArchiveRole,
  useCloneRole,
  useCreateRole,
  useDeleteRole,
  useRestoreRole,
  useRoles,
} from '@/features/rbac/hooks/use-rbac';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import type { RoleRecord } from '@/features/rbac/api/rbac.api';
import { useAuthStore } from '@/shared/stores/app.store';

export function RolesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [cloneTarget, setCloneTarget] = useState<RoleRecord | null>(null);
  const [cloneName, setCloneName] = useState('');
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data, isLoading, isError } = useRoles({ search: search || undefined, pageSize: 50 });
  const createMutation = useCreateRole();
  const cloneMutation = useCloneRole();
  const archiveMutation = useArchiveRole();
  const restoreMutation = useRestoreRole();
  const deleteMutation = useDeleteRole();

  useEffect(() => {
    if (searchParams.get('action') === 'create' && hasPermission('rbac.role.create') && !showCreate) {
      setShowCreate(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, showCreate, setSearchParams, hasPermission]);

  const columns = [
    { key: 'name', header: 'Role' },
    { key: 'slug', header: 'Slug' },
    { key: 'priority', header: 'Priority' },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: '',
      render: (row: RoleRecord) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`${ROUTES.RBAC_MATRIX}?roleId=${row.id}`}>Permissions</Link>
          </Button>
          {hasPermission('rbac.role.clone') ? (
            <Button variant="ghost" size="sm" onClick={() => { setCloneTarget(row); setCloneName(`${row.name} Copy`); }}>
              <Copy className="h-4 w-4" />
            </Button>
          ) : null}
          {row.isArchived && hasPermission('rbac.role.update') ? (
            <Button variant="ghost" size="sm" onClick={() => void restoreMutation.mutateAsync(row.id)}>Restore</Button>
          ) : null}
          {!row.isSystem && hasPermission('rbac.role.update') && !row.isArchived ? (
            <Button variant="ghost" size="sm" onClick={() => void archiveMutation.mutateAsync(row.id)}>Archive</Button>
          ) : null}
          {!row.isSystem && hasPermission('rbac.role.delete') ? (
            <Button variant="ghost" size="sm" onClick={() => void deleteMutation.mutateAsync(row.id)}>Delete</Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (isLoading) return <Loading message="Loading roles..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Shield className="h-6 w-6 text-primary" />}
        title="Roles"
        description="Create, clone, archive, and assign permissions to enterprise roles."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.RBAC_TEMPLATES}>Templates</Link></Button>
            {hasPermission('rbac.role.create') ? (
              <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Role</Button>
            ) : null}
          </div>
        }
      />
      <Link to={ROUTES.RBAC} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Access Control
      </Link>
      <Input placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      {isError && <p className="text-destructive">Failed to load roles.</p>}
      <DataTable columns={columns} data={data?.items ?? []} />

      {showCreate ? (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">Create Role</h3>
          <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name" />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void createMutation.mutateAsync({ name: newRoleName }).then(() => { setShowCreate(false); setNewRoleName(''); })} disabled={!newRoleName.trim()}>Create</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {cloneTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Clone {cloneTarget.name}</h3>
            <Input value={cloneName} onChange={(e) => setCloneName(e.target.value)} className="mt-4" />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCloneTarget(null)}>Cancel</Button>
              <Button onClick={() => void cloneMutation.mutateAsync({ id: cloneTarget.id, name: cloneName.trim() }).then(() => setCloneTarget(null))} disabled={!cloneName.trim()}>Clone</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
