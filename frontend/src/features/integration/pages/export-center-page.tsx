import { useState } from 'react';
import { Download, FileOutput } from 'lucide-react';
import type { ExportFormat } from '@/features/integration/api/integration.api';
import { StatusBadge } from '@/features/integration/components/status-badge';
import {
  useCreateExportJob,
  useDownloadExport,
  useExportHistory,
  useImportModules,
} from '@/features/integration/hooks/use-integration';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const FORMAT_OPTIONS: ExportFormat[] = ['csv', 'xlsx', 'json', 'pdf'];

export function ExportCenterPage() {
  const [module, setModule] = useState('');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [searchFilter, setSearchFilter] = useState('');

  const { data: modules } = useImportModules();
  const { data: history, isLoading: historyLoading } = useExportHistory({ page: 1, pageSize: 20 });
  const createMutation = useCreateExportJob();
  const downloadMutation = useDownloadExport();

  async function handleExport() {
    if (!module) return;
    await createMutation.mutateAsync({
      module,
      format,
      filters: searchFilter.trim() ? { search: searchFilter.trim() } : undefined,
    });
  }

  async function handleDownload(id: string, fileName?: string) {
    const blob = await downloadMutation.mutateAsync(id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName ?? `export-${id}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileOutput className="h-6 w-6 text-primary" />}
        title="Export Center"
        description="Bulk export tenant data with format selection, filters, job history, and download."
      />

      <section className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">New Export</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Module</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="">Select module…</option>
              {(modules ?? []).map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Format</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Filter (optional)</label>
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search term…"
            />
          </div>
        </div>
        <Button disabled={!module || createMutation.isPending} onClick={() => void handleExport()}>
          {createMutation.isPending ? 'Starting export…' : 'Start Bulk Export'}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Export History</h2>
        {historyLoading ? <Loading message="Loading export history..." /> : null}
        <DataTable
          columns={[
            { key: 'module', header: 'Module' },
            { key: 'format', header: 'Format', render: (row) => row.format.toUpperCase() },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: 'fileSizeBytes',
              header: 'Size',
              render: (row) =>
                row.fileSizeBytes ? `${Math.round(row.fileSizeBytes / 1024)} KB` : '—',
            },
            {
              key: 'createdAt',
              header: 'Started',
              render: (row) => new Date(row.createdAt).toLocaleString(),
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                row.status === 'completed' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={downloadMutation.isPending}
                    onClick={() => void handleDownload(row.id, row.fileName)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                ) : null,
            },
          ]}
          data={history?.items ?? []}
          emptyMessage="No export jobs yet."
        />
      </section>
    </div>
  );
}
