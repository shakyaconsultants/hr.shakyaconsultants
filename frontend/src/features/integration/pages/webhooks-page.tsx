import { useState } from 'react';
import { Plus, Webhook } from 'lucide-react';
import type { Webhook as WebhookType } from '@/features/integration/api/integration.api';
import { StatusBadge } from '@/features/integration/components/status-badge';
import { WebhookForm } from '@/features/integration/components/webhook-form';
import {
  useCreateWebhook,
  useDeleteWebhook,
  useRetryWebhookDelivery,
  useTestWebhook,
  useWebhookDeliveries,
  useWebhooks,
} from '@/features/integration/hooks/use-integration';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';

export function WebhooksPage() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<WebhookType | null>(null);

  const { data, isLoading, isError } = useWebhooks({ page: 1, pageSize: 50 });
  const { data: deliveries, isLoading: deliveriesLoading } = useWebhookDeliveries(selected?.id ?? '');
  const createMutation = useCreateWebhook();
  const deleteMutation = useDeleteWebhook();
  const testMutation = useTestWebhook();
  const retryMutation = useRetryWebhookDelivery();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Webhook className="h-6 w-6 text-primary" />}
        title="Webhooks"
        description="Register outbound webhooks, configure events, review delivery logs, and test delivery."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" />
            Register Webhook
          </Button>
        }
      />

      {showForm ? (
        <WebhookForm
          onSubmit={(payload) => {
            void createMutation.mutateAsync(payload).then(() => setShowForm(false));
          }}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      ) : null}

      {isLoading ? <Loading message="Loading webhooks..." /> : null}
      {isError ? <p className="text-sm text-muted-foreground">Webhooks API unavailable.</p> : null}

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          {
            key: 'url',
            header: 'URL',
            render: (row) => <span className="max-w-[240px] truncate">{row.url}</span>,
          },
          {
            key: 'events',
            header: 'Events',
            render: (row) => row.events.join(', '),
          },
          {
            key: 'enabled',
            header: 'Status',
            render: (row) => <StatusBadge status={row.enabled ? 'active' : 'disabled'} />,
          },
          {
            key: 'retryPolicy',
            header: 'Retry Policy',
            render: (row) => `${row.retryPolicy.maxAttempts}× / ${row.retryPolicy.backoffSeconds}s`,
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                  Deliveries
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={testMutation.isPending}
                  onClick={() => void testMutation.mutateAsync({ id: row.id })}
                >
                  Test
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void deleteMutation.mutateAsync(row.id)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No webhooks registered."
        onRowClick={setSelected}
      />

      {selected ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Delivery Logs — {selected.name}</h2>
          {deliveriesLoading ? <Loading message="Loading deliveries..." /> : null}
          <DataTable
            columns={[
              { key: 'event', header: 'Event' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              { key: 'statusCode', header: 'HTTP', render: (row) => row.statusCode ?? '—' },
              { key: 'attempt', header: 'Attempt' },
              {
                key: 'createdAt',
                header: 'Time',
                render: (row) => new Date(row.createdAt).toLocaleString(),
              },
              {
                key: 'actions',
                header: '',
                render: (row) =>
                  row.status === 'failed' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void retryMutation.mutateAsync({
                          webhookId: selected.id,
                          deliveryId: row.id,
                        })
                      }
                    >
                      Retry
                    </Button>
                  ) : null,
              },
            ]}
            data={deliveries?.items ?? []}
            emptyMessage="No delivery attempts yet."
          />
        </section>
      ) : null}
    </div>
  );
}
