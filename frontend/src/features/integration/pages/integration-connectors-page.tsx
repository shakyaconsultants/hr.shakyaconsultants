import { useState } from 'react';
import { Plus, Plug } from 'lucide-react';
import type { Connector, ConnectorProvider } from '@/features/integration/api/integration.api';
import { ConnectorCard } from '@/features/integration/components/connector-card';
import {
  useConnectors,
  useCreateConnector,
  useTestConnector,
  useToggleConnector,
} from '@/features/integration/hooks/use-integration';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const PROVIDER_OPTIONS: Array<{ value: ConnectorProvider; label: string }> = [
  { value: 'cloudinary', label: 'Cloudinary (Storage)' },
  { value: 'smtp', label: 'SMTP (Email)' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'slack', label: 'Slack' },
  { value: 'google_calendar', label: 'Google Calendar' },
];

export function IntegrationConnectorsPage() {
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<ConnectorProvider>('cloudinary');
  const [name, setName] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: connectors, isLoading, isError } = useConnectors();
  const createMutation = useCreateConnector();
  const testMutation = useTestConnector();
  const toggleMutation = useToggleConnector();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      provider,
      name: name.trim(),
      config: {},
      enabled: true,
    });
    setName('');
    setShowForm(false);
  }

  async function handleTest(connector: Connector) {
    setTestingId(connector.id);
    try {
      await testMutation.mutateAsync(connector.id);
    } finally {
      setTestingId(null);
    }
  }

  async function handleToggle(connector: Connector, enabled: boolean) {
    setTogglingId(connector.id);
    try {
      await toggleMutation.mutateAsync({ id: connector.id, enabled });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Plug className="h-6 w-6 text-primary" />}
        title="Integration Connectors"
        description="Manage Cloudinary, SMTP, REST APIs, and future provider connections."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Connector
          </Button>
        }
      />

      {showForm ? (
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4 rounded-lg border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Provider</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={provider}
                onChange={(e) => setProvider(e.target.value as ConnectorProvider)}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Display Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production SMTP" required />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? 'Creating…' : 'Create Connector'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? <Loading message="Loading connectors..." /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">
          Connectors API unavailable — configure providers when the backend is connected.
        </p>
      ) : null}

      {!isLoading && connectors?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No connectors configured. Add Cloudinary for storage or SMTP for email delivery.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(connectors ?? []).map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onTest={handleTest}
            onToggle={handleToggle}
            isTesting={testingId === connector.id}
            isToggling={togglingId === connector.id}
          />
        ))}
      </div>
    </div>
  );
}
