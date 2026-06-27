import { Link } from 'react-router-dom';
import { Building2, GitBranch, Layers, Network, Settings2, Wand2 } from 'lucide-react';
import { ENTITY_CATALOG } from '@/features/organization/constants/entity-catalog';
import { ROUTES } from '@/config/app.config';
import { useQuery } from '@tanstack/react-query';
import { getCompany } from '@/features/organization/api/organization.api';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/app.store';

export function OrganizationDashboardPage() {
  const authCompany = useAuthStore((s) => s.company);
  const { data: company } = useQuery({
    queryKey: ['organization', 'company'],
    queryFn: getCompany,
  });

  const companyName = String(company?.name ?? authCompany?.name ?? '—');
  const companyCode = String(company?.code ?? authCompany?.code ?? '');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organization"
        description="Configure company structure, master data, and organizational hierarchy from the enterprise console."
        actions={
          <>
            <Button asChild variant="default">
              <Link to={ROUTES.ORGANIZATION_SETUP}>
                <Wand2 className="mr-2 h-4 w-4" />
                Setup Wizard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={ROUTES.ORGANIZATION_CHART}>
                <Network className="mr-2 h-4 w-4" />
                Org Chart
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <h2 className="font-semibold">Company</h2>
          </div>
          <p className="text-2xl font-bold">{companyName}</p>
          <p className="text-sm text-muted-foreground">{companyCode}</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Layers className="h-5 w-5" />
            <h2 className="font-semibold">Master Data</h2>
          </div>
          <p className="text-2xl font-bold">{ENTITY_CATALOG.length}</p>
          <p className="text-sm text-muted-foreground">Entity types configured</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <GitBranch className="h-5 w-5" />
            <h2 className="font-semibold">Quick Setup</h2>
          </div>
          <Link to={ROUTES.ORGANIZATION_SETUP} className="text-sm font-medium text-primary hover:underline">
            Resume company setup wizard →
          </Link>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Settings2 className="h-5 w-5" />
            <h2 className="font-semibold">System Settings</h2>
          </div>
          <Link to={ROUTES.ADMIN_SETTINGS} className="text-sm font-medium text-primary hover:underline">
            Manage dynamic settings →
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Master Data Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTITY_CATALOG.map((entity) => (
            <Link
              key={entity.key}
              to={ROUTES.organizationEntity(entity.key)}
              className="rounded-lg border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
            >
              <h3 className="font-semibold">{entity.pluralLabel}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{entity.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
