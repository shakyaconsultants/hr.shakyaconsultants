import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useRoleTemplates } from '@/features/rbac/hooks/use-rbac';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';

export function RoleTemplatesPage() {
  const { data, isLoading, isError } = useRoleTemplates();

  if (isLoading) return <Loading message="Loading role templates..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Role Templates" description="Blueprint roles with predefined permission sets for rapid provisioning." />
      <Link to={ROUTES.RBAC_ROLES} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Roles
      </Link>
      {isError && <p className="text-destructive">Failed to load templates.</p>}
      <DataTable
        columns={[
          { key: 'name', header: 'Template' },
          { key: 'slug', header: 'Slug' },
          { key: 'priority', header: 'Priority' },
          { key: 'permissions', header: 'Permissions', render: (row) => row.permissionCodes.length },
        ]}
        data={data ?? []}
      />
    </div>
  );
}
