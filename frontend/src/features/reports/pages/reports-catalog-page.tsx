import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import type { ReportDefinition, ReportFilterParams } from '@/features/reports/api/reports.api';
import { getDefaultReportFilters, ReportFilters } from '@/features/reports/components/report-filters';
import { useReportDefinitions } from '@/features/reports/hooks/use-reports';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const DOMAIN_OPTIONS = ['', 'hr', 'finance', 'project', 'sales', 'attendance', 'operations', 'communication'];

export function ReportsCatalogPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilterParams>(getDefaultReportFilters());
  const [domainFilter, setDomainFilter] = useState('');
  const [search, setSearch] = useState('');

  const queryParams = useMemo(
    () => ({
      ...filters,
      domain: domainFilter || undefined,
      search: search || filters.search || undefined,
      pageSize: 100,
    }),
    [filters, domainFilter, search],
  );

  const { data, isLoading, isError } = useReportDefinitions(queryParams);

  const handleRun = (definition: ReportDefinition) => {
    if (definition.moduleRoute) {
      navigate(definition.moduleRoute);
      return;
    }
    const [domain, type] = definition.code.includes('.')
      ? definition.code.split('.', 2)
      : [definition.domain, definition.code];
    navigate(ROUTES.reportRun(domain, type));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="h-6 w-6 text-primary" />}
        title="Report Catalog"
        description="Searchable catalog of enterprise reports. Run a report or export results."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Input
          placeholder="Search reports by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border p-2 text-sm"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
        >
          <option value="">All domains</option>
          {DOMAIN_OPTIONS.filter(Boolean).map((domain) => (
            <option key={domain} value={domain}>
              {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <ReportFilters value={filters} onChange={setFilters} showSearch={false} />

      {isLoading ? (
        <Loading message="Loading report catalog..." />
      ) : isError ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Unable to load report definitions.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.items ?? []).map((definition) => (
            <article key={definition.code} className="flex flex-col rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{definition.name}</h3>
                  <p className="text-xs uppercase text-muted-foreground">{definition.domain}</p>
                </div>
                {definition.category ? (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">{definition.category}</span>
                ) : null}
              </div>
              {definition.description ? (
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{definition.description}</p>
              ) : (
                <div className="flex-1" />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={() => handleRun(definition)}>
                  <Play className="mr-1.5 h-4 w-4" />
                  Run Report
                </Button>
                {definition.moduleRoute ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => navigate(definition.moduleRoute!)}>
                    Module View
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
          {(data?.items ?? []).length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No reports match your filters.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
