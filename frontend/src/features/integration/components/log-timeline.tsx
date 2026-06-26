import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { IntegrationLogEntry } from '@/features/integration/api/integration.api';
import { cn } from '@/shared/utils/cn';

interface LogTimelineProps {
  entries: IntegrationLogEntry[];
  selectedId?: string;
  onSelect?: (entry: IntegrationLogEntry) => void;
}

const LEVEL_ICONS = {
  debug: Info,
  info: Info,
  warn: AlertCircle,
  error: XCircle,
};

const LEVEL_COLORS = {
  debug: 'text-muted-foreground',
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-destructive',
};

export function LogTimeline({ entries, selectedId, onSelect }: LogTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No integration logs match your filters.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" aria-hidden />
      <ul className="space-y-2">
        {entries.map((entry) => {
          const Icon = LEVEL_ICONS[entry.level] ?? Info;
          const color = LEVEL_COLORS[entry.level] ?? 'text-muted-foreground';
          const Wrapper = onSelect ? 'button' : 'div';

          return (
            <li key={entry.id}>
              <Wrapper
                type={onSelect ? 'button' : undefined}
                onClick={onSelect ? () => onSelect(entry) : undefined}
                className={cn(
                  'relative flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                  onSelect && 'hover:bg-muted/50',
                  selectedId === entry.id ? 'border-primary bg-primary/5' : 'bg-card',
                )}
              >
                <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                  <Icon className={cn('h-4 w-4', color)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{entry.message}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.category}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.source}</span>
                  </div>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                    <pre className="mt-1 max-h-20 overflow-auto text-xs text-muted-foreground">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  ) : null}
                  <time className="mt-1 block text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </div>
                {entry.level === 'info' ? (
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0" aria-hidden />
                ) : null}
              </Wrapper>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
