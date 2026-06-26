import { Clock } from 'lucide-react';
import type { AuditLogEntry } from '@/features/configuration/api/configuration.api';
import { cn } from '@/shared/utils/cn';

interface AuditTimelineProps {
  entries: AuditLogEntry[];
  selectedId?: string;
  onSelect: (entry: AuditLogEntry) => void;
}

export function AuditTimeline({ entries, selectedId, onSelect }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No audit events match your filters.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" aria-hidden />
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className={cn(
                'relative flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                selectedId === entry.id ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50',
              )}
            >
              <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{entry.action}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.entity}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {entry.userName ?? entry.userEmail ?? entry.userId}
                  {entry.entityId ? ` · ${entry.entityId}` : ''}
                </p>
                <time className="mt-1 block text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
