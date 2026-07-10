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
  const [forAttendance, setForAttendance] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      permissions: forAttendance
        ? []
        : permissions
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
      rateLimitPerMinute: rateLimit ? Number(rateLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    });
  }

  function enableAttendancePreset() {
    setForAttendance(true);
    if (!name.trim()) {
      setName('Attendance Kiosk');
    }
    setPermissions('');
    setExpiresAt('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
        <p className="font-medium text-blue-950 dark:text-blue-100">
          Face recognition / attendance kiosk?
        </p>
        <p className="mt-1 text-blue-900/80 dark:text-blue-200/80">
          Only <strong>Name</strong> is required. Permissions and expiry are optional — leave them
          empty.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={enableAttendancePreset}
        >
          Use attendance kiosk preset
        </Button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Attendance Kiosk"
          required
        />
      </div>
      {!forAttendance ? (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Permissions <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
            placeholder="Leave empty for attendance kiosk"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Not used by attendance punch API today. Leave empty unless HR adds custom integrations
            later.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Attendance kiosk mode — permissions skipped. Punch API only checks that the key is valid.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Rate limit <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            type="number"
            min={1}
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            placeholder="Default: 1000"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Expires <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <DatePicker
            value={expiresAt}
            onChange={setExpiresAt}
            min={toDateInputValue(new Date())}
          />
          <p className="mt-1 text-xs text-muted-foreground">Leave empty — key does not expire.</p>
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
