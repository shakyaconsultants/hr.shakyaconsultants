import { useState } from 'react';
import type { ApiKey, CreateApiKeyPayload } from '@/features/integration/api/integration.api';
import { DatePicker } from '@/shared/components/date-picker';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { toDateInputValue } from '@/shared/utils/datetime';

interface ApiKeyFormProps {
  initial?: Partial<ApiKey>;
  onSubmit: (payload: CreateApiKeyPayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ApiKeyForm({ initial, onSubmit, onCancel, isSubmitting }: ApiKeyFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [permissions, setPermissions] = useState((initial?.permissions ?? []).join(', '));
  const [rateLimit, setRateLimit] = useState(String(initial?.rateLimitPerMinute ?? ''));
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt?.slice(0, 10) ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      permissions: permissions
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      rateLimitPerMinute: rateLimit ? Number(rateLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production API Key" required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Permissions</label>
        <Input
          value={permissions}
          onChange={(e) => setPermissions(e.target.value)}
          placeholder="employee.read, leave.read"
        />
        <p className="mt-1 text-xs text-muted-foreground">Comma-separated permission codes</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Rate limit (per minute)</label>
          <Input
            type="number"
            min={1}
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Expires</label>
          <DatePicker value={expiresAt} onChange={setExpiresAt} min={toDateInputValue(new Date())} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? 'Saving…' : initial?.id ? 'Update Key' : 'Create Key'}
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
