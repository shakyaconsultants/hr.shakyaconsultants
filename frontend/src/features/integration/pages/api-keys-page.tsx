import { useState } from 'react';
import { Key, Plus, RefreshCw, ShieldOff } from 'lucide-react';
import type { ApiKey } from '@/features/integration/api/integration.api';
import { ApiKeyForm } from '@/features/integration/components/api-key-form';
import { StatusBadge } from '@/features/integration/components/status-badge';
import {
  useApiKeys,
  useApiKeyUsage,
  useCreateApiKey,
  useRegenerateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
} from '@/features/integration/hooks/use-integration';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';

export function ApiKeysPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useApiKeys({ page, pageSize: 20 });
  const { data: usageData, isLoading: usageLoading } = useApiKeyUsage(selectedKey?.id ?? '', {
    page: 1,
    pageSize: 20,
  });
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();
  const rotateMutation = useRotateApiKey();
  const regenerateMutation = useRegenerateApiKey();

  async function handleCreate(payload: Parameters<typeof createMutation.mutateAsync>[0]) {
    const created = await createMutation.mutateAsync(payload);
    setNewSecret(created.secret);
    setShowForm(false);
  }

  async function handleRotate(key: ApiKey) {
    const result = await rotateMutation.mutateAsync(key.id);
    setNewSecret(result.secret);
  }

  async function handleRegenerate(key: ApiKey) {
    const result = await regenerateMutation.mutateAsync(key.id);
    setNewSecret(result.secret);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Key className="h-6 w-6 text-primary" />}
        title="API Keys"
        description="Create, rotate, and revoke programmatic access keys with scoped permissions and rate limits."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" />
            New API Key
          </Button>
        }
      />

      {newSecret ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
          <p className="text-sm font-medium">Copy your API key now — it will not be shown again.</p>
          <code className="mt-2 block break-all rounded bg-background p-2 text-sm">{newSecret}</code>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewSecret(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {showForm ? (
        <ApiKeyForm
          onSubmit={(payload) => void handleCreate(payload)}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      ) : null}

      {isLoading ? <Loading message="Loading API keys..." /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">API keys endpoint unavailable.</p>
      ) : null}

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'prefix', header: 'Prefix', render: (row) => <code>{row.prefix}…</code> },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'permissions',
            header: 'Permissions',
            render: (row) => row.permissions.join(', ') || '—',
          },
          {
            key: 'rateLimitPerMinute',
            header: 'Rate Limit',
            render: (row) => (row.rateLimitPerMinute ? `${row.rateLimitPerMinute}/min` : '—'),
          },
          {
            key: 'lastUsedAt',
            header: 'Last Used',
            render: (row) => (row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : 'Never'),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelectedKey(row)}>
                  Usage
                </Button>
                {row.status === 'active' ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => void handleRotate(row)}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleRegenerate(row)}>
                      Regenerate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void revokeMutation.mutateAsync(row.id)}
                    >
                      <ShieldOff className="h-3 w-3" />
                    </Button>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No API keys created yet."
        onRowClick={setSelectedKey}
      />

      {data && data.pagination.totalPages > 1 ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      {selectedKey ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Usage Logs — {selectedKey.name}</h2>
          {usageLoading ? <Loading message="Loading usage logs..." /> : null}
          <DataTable
            columns={[
              { key: 'method', header: 'Method' },
              { key: 'path', header: 'Path' },
              { key: 'statusCode', header: 'Status' },
              { key: 'ip', header: 'IP', render: (row) => row.ip ?? '—' },
              {
                key: 'timestamp',
                header: 'Time',
                render: (row) => new Date(row.timestamp).toLocaleString(),
              },
            ]}
            data={usageData?.items ?? []}
            emptyMessage="No usage recorded for this key."
          />
        </section>
      ) : null}
    </div>
  );
}
