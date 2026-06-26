import { X } from 'lucide-react';
import type { AuditLogEntry } from '@/features/configuration/api/configuration.api';
import { Button } from '@/shared/components/ui/button';

interface AuditDetailDrawerProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

export function AuditDetailDrawer({ entry, onClose }: AuditDetailDrawerProps) {
  if (!entry) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col border-l bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Audit Event Detail</p>
          <p className="font-mono text-xs text-muted-foreground">{entry.id}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close detail">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <DetailRow label="Action" value={entry.action} />
        <DetailRow label="Entity" value={entry.entity} />
        {entry.entityId ? <DetailRow label="Entity ID" value={entry.entityId} mono /> : null}
        <DetailRow label="User" value={entry.userName ?? entry.userEmail ?? entry.userId} />
        <DetailRow label="Timestamp" value={new Date(entry.timestamp).toLocaleString()} />
        {entry.ip ? <DetailRow label="IP Address" value={entry.ip} mono /> : null}
        {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metadata</p>
            <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? 'mt-0.5 font-mono text-xs break-all' : 'mt-0.5'}>{value}</p>
    </div>
  );
}
