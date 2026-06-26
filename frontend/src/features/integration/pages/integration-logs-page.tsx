import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import type { IntegrationLogEntry, LogLevel } from '@/features/integration/api/integration.api';
import { LogTimeline } from '@/features/integration/components/log-timeline';
import { useIntegrationLogs } from '@/features/integration/hooks/use-integration';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Input } from '@/shared/components/ui/input';

const LEVEL_OPTIONS: Array<LogLevel | ''> = ['', 'debug', 'info', 'warn', 'error'];

export function IntegrationLogsPage() {
  const [filters, setFilters] = useState({
    search: '',
    level: '' as LogLevel | '',
    source: '',
    category: '',
    from: '',
    to: '',
    page: 1,
  });
  const [selected, setSelected] = useState<IntegrationLogEntry | null>(null);

  const { data, isLoading, isError } = useIntegrationLogs({
    page: filters.page,
    pageSize: 50,
    search: filters.search || undefined,
    level: filters.level || undefined,
    source: filters.source || undefined,
    category: filters.category || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ScrollText className="h-6 w-6 text-primary" />}
        title="Integration Logs"
        description="Unified integration activity log with filters, search, and timeline view."
      />

      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.level}
          onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value as LogLevel | '', page: 1 }))}
        >
          {LEVEL_OPTIONS.map((level) => (
            <option key={level || 'all'} value={level}>
              {level ? level.toUpperCase() : 'All levels'}
            </option>
          ))}
        </select>
        <Input
          placeholder="Source"
          value={filters.source}
          onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value, page: 1 }))}
        />
        <Input
          placeholder="Category"
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
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

      {isLoading ? <Loading message="Loading integration logs..." /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">Integration logs API unavailable.</p>
      ) : null}

      {!isLoading ? (
        <LogTimeline
          entries={data?.items ?? []}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
      ) : null}

      {selected?.metadata ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Event Detail</h2>
          <pre className="overflow-auto text-xs">{JSON.stringify(selected.metadata, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  );
}
