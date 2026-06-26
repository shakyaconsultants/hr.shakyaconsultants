import { useState } from 'react';
import { Download } from 'lucide-react';
import type { AuditLogEntry } from '@/features/configuration/api/configuration.api';
import { AuditDetailDrawer } from '@/features/configuration/components/audit-detail-drawer';
import { AuditTimeline } from '@/features/configuration/components/audit-timeline';
import { useAuditLogs, useExportAuditLogs } from '@/features/configuration/hooks/use-configuration';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function AuditExplorerPage() {
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entity: '',
    from: '',
    to: '',
    page: 1,
  });
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data, isLoading, isError } = useAuditLogs({
    page: filters.page,
    pageSize: 50,
    search: filters.search || undefined,
    action: filters.action || undefined,
    entity: filters.entity || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  const exportMutation = useExportAuditLogs();

  async function handleExport() {
    const blob = await exportMutation.mutateAsync({
      search: filters.search || undefined,
      action: filters.action || undefined,
      entity: filters.entity || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Audit Explorer"
          description="Search and review security-relevant events across the platform."
        />
        <Button variant="outline" disabled={exportMutation.isPending} onClick={() => void handleExport()}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <Input
          placeholder="Action"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
        />
        <Input
          placeholder="Entity"
          value={filters.entity}
          onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
        />
      </div>

      {isLoading ? <Loading message="Loading audit events..." /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">
          Audit API unavailable — events will appear when the backend audit endpoint is connected.
        </p>
      ) : null}

      {!isLoading ? (
        <>
          <AuditTimeline
            entries={data?.items ?? []}
            selectedId={selected?.id}
            onSelect={setSelected}
          />
          {(data?.pagination.totalPages ?? 1) > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {data?.pagination.page} of {data?.pagination.totalPages} ({data?.pagination.total} events)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= (data?.pagination.totalPages ?? 1)}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <AuditDetailDrawer entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
