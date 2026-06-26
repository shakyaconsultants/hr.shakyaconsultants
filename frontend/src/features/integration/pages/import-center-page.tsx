import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { ImportPreviewResult } from '@/features/integration/api/integration.api';
import { ImportPreviewTable } from '@/features/integration/components/import-preview-table';
import { StatusBadge } from '@/features/integration/components/status-badge';
import {
  useExecuteImport,
  useImportHistory,
  useImportModules,
  usePreviewImport,
} from '@/features/integration/hooks/use-integration';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';

export function ImportCenterPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [module, setModule] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);

  const { data: modules, isLoading: modulesLoading } = useImportModules();
  const { data: history, isLoading: historyLoading } = useImportHistory({ page: 1, pageSize: 20 });
  const previewMutation = usePreviewImport();
  const executeMutation = useExecuteImport();

  const selectedModule = modules?.find((m) => m.key === module);
  const fields = selectedModule?.fields ?? (preview?.rows[0] ? Object.keys(preview.rows[0].data) : []);

  async function handlePreview() {
    if (!file || !module) return;
    const result = await previewMutation.mutateAsync({ module, file });
    setPreview(result);
  }

  async function handleExecute() {
    if (!file || !module) return;
    await executeMutation.mutateAsync({ module, file });
    setPreview(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Upload className="h-6 w-6 text-primary" />}
        title="Import Center"
        description="Bulk import data via CSV with preview, validation, duplicate detection, and job history."
      />

      <section className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">New Import</h2>
        {modulesLoading ? <Loading message="Loading modules..." /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Target Module</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPreview(null);
              }}
            >
              <option value="">Select module…</option>
              {(modules ?? []).map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            {selectedModule?.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{selectedModule.description}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">CSV File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!file || !module || previewMutation.isPending}
            onClick={() => void handlePreview()}
          >
            {previewMutation.isPending ? 'Validating…' : 'Preview & Validate'}
          </Button>
          <Button
            disabled={!file || !module || !preview || preview.errorRows > 0 || executeMutation.isPending}
            onClick={() => void handleExecute()}
          >
            {executeMutation.isPending ? 'Importing…' : 'Execute Import'}
          </Button>
        </div>

        {preview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Total: {preview.totalRows}</span>
              <span className="text-green-600">Valid: {preview.validRows}</span>
              <span className="text-destructive">Errors: {preview.errorRows}</span>
              <span className="text-amber-600">Duplicates: {preview.duplicateRows}</span>
            </div>
            <ImportPreviewTable rows={preview.rows} fields={fields} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Import History</h2>
        {historyLoading ? <Loading message="Loading history..." /> : null}
        <DataTable
          columns={[
            { key: 'module', header: 'Module' },
            { key: 'fileName', header: 'File' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: 'progress',
              header: 'Progress',
              render: (row) => `${row.processedRows}/${row.totalRows}`,
            },
            {
              key: 'errorRows',
              header: 'Errors',
              render: (row) => row.errorRows,
            },
            {
              key: 'createdAt',
              header: 'Started',
              render: (row) => new Date(row.createdAt).toLocaleString(),
            },
          ]}
          data={history?.items ?? []}
          emptyMessage="No import jobs yet."
        />
      </section>
    </div>
  );
}
