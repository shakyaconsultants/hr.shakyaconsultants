import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Copy, Plus, Shield } from 'lucide-react';
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
import { FilterBar } from '@/shared/components/filter-bar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { FormDialog } from '@/shared/components/form-dialog';
import { Dialog } from '@/shared/components/ui/dialog';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { runActionMutation, runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
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
  const [createError, setCreateError] = useState<string | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
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
            <Button
              variant="ghost"
              size="sm"
              disabled={restoreMutation.isPending}
              onClick={() =>
                void runActionMutation({
                  successMessage: `Role "${row.name}" restored successfully.`,
                  mutation: () => restoreMutation.mutateAsync(row.id),
                })
              }
            >
              Restore
            </Button>
          ) : null}
          {!row.isSystem && hasPermission('rbac.role.update') && !row.isArchived ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={archiveMutation.isPending}
              onClick={() =>
                void runActionMutation({
                  successMessage: `Role "${row.name}" archived successfully.`,
                  mutation: () => archiveMutation.mutateAsync(row.id),
                })
              }
            >
              Archive
            </Button>
          ) : null}
          {!row.isSystem && hasPermission('rbac.role.delete') ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() =>
                void runDeleteMutation({
                  entityLabel: 'Role',
                  successMessage: `Role "${row.name}" deleted successfully.`,
                  mutation: () => deleteMutation.mutateAsync(row.id),
                })
              }
            >
              Delete
            </Button>
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
        breadcrumbs={[
          { label: 'Access Control', href: ROUTES.RBAC },
          { label: 'Roles' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.RBAC_TEMPLATES}>Templates</Link></Button>
            {hasPermission('rbac.role.create') ? (
              <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Role</Button>
            ) : null}
          </div>
        }
      />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search roles…" />
      <PageDataBoundary isLoading={false} isError={isError} source="roles-list">
        <DataTable columns={columns} data={data?.items ?? []} emptyTitle="No roles yet" emptyMessage="Create a role to get started." />
      </PageDataBoundary>

      <FormDialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) {
            setCreateError(null);
            setNewRoleName('');
          }
        }}
        title="Create Role"
        description="Add a new enterprise role without leaving the list."
        submitLabel="Create"
        isSubmitting={createMutation.isPending}
        submitDisabled={!newRoleName.trim()}
        onSubmit={async () => {
          if (createMutation.isPending) {
            return;
          }
          await runFormMutation({
            setError: setCreateError,
            successMessage: `Role "${newRoleName.trim()}" created successfully.`,
            mutation: () => createMutation.mutateAsync({ name: newRoleName }),
            onSuccess: () => {
              setShowCreate(false);
              setNewRoleName('');
            },
          });
        }}
      >
        <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name" />
        {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
      </FormDialog>

      <Dialog
        open={Boolean(cloneTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCloneTarget(null);
            setCloneError(null);
            setCloneName('');
          }
        }}
        title={cloneTarget ? `Clone ${cloneTarget.name}` : 'Clone role'}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCloneTarget(null);
                setCloneError(null);
                setCloneName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!cloneTarget || cloneMutation.isPending) {
                  return;
                }
                void runFormMutation({
                  setError: setCloneError,
                  successMessage: `Role "${cloneName.trim()}" cloned successfully.`,
                  mutation: () => cloneMutation.mutateAsync({ id: cloneTarget.id, name: cloneName.trim() }),
                  onSuccess: () => setCloneTarget(null),
                });
              }}
              disabled={!cloneName.trim() || cloneMutation.isPending}
            >
              Clone
            </Button>
          </div>
        }
      >
        <Input value={cloneName} onChange={(e) => setCloneName(e.target.value)} />
        {cloneError ? <p className="text-sm text-destructive">{cloneError}</p> : null}
      </Dialog>
    </div>
  );
}
