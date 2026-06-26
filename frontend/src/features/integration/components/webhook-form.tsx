import { useState } from 'react';
import type { CreateWebhookPayload, Webhook, WebhookRetryPolicy } from '@/features/integration/api/integration.api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const DEFAULT_EVENTS = [
  'employee.created',
  'employee.updated',
  'leave.approved',
  'payroll.processed',
  'attendance.corrected',
];

interface WebhookFormProps {
  initial?: Partial<Webhook>;
  onSubmit: (payload: CreateWebhookPayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function WebhookForm({ initial, onSubmit, onCancel, isSubmitting }: WebhookFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [events, setEvents] = useState((initial?.events ?? []).join(', '));
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [retryPolicy, setRetryPolicy] = useState<WebhookRetryPolicy>(
    initial?.retryPolicy ?? { maxAttempts: 3, backoffSeconds: 60 },
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      url: url.trim(),
      events: events
        .split(',')
        .map((ev) => ev.trim())
        .filter(Boolean),
      enabled,
      retryPolicy,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="HR Events Webhook" required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Endpoint URL</label>
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhooks/hr-shakya"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Events</label>
        <Input
          value={events}
          onChange={(e) => setEvents(e.target.value)}
          placeholder={DEFAULT_EVENTS.join(', ')}
        />
        <p className="mt-1 text-xs text-muted-foreground">Comma-separated event names</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Max retry attempts</label>
          <Input
            type="number"
            min={0}
            max={10}
            value={retryPolicy.maxAttempts}
            onChange={(e) =>
              setRetryPolicy((p) => ({ ...p, maxAttempts: Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Backoff (seconds)</label>
          <Input
            type="number"
            min={1}
            value={retryPolicy.backoffSeconds}
            onChange={(e) =>
              setRetryPolicy((p) => ({ ...p, backoffSeconds: Number(e.target.value) }))
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !name.trim() || !url.trim()}>
          {isSubmitting ? 'Saving…' : initial?.id ? 'Update Webhook' : 'Register Webhook'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
