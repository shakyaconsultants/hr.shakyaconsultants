import { History, X } from 'lucide-react';
import { useSettingHistory } from '@/features/configuration/hooks/use-configuration';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

interface SettingHistoryPanelProps {
  settingKey: string | null;
  onClose: () => void;
}

export function SettingHistoryPanel({ settingKey, onClose }: SettingHistoryPanelProps) {
  const { data, isLoading, isError } = useSettingHistory({
    key: settingKey ?? '',
    page: 1,
    pageSize: 50,
  });

  if (!settingKey) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">Change History</p>
            <p className="font-mono text-xs text-muted-foreground">{settingKey}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close history">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? <Loading message="Loading history..." /> : null}
        {isError ? (
          <p className="text-sm text-muted-foreground">No history available for this setting yet.</p>
        ) : null}
        {!isLoading && !isError && (data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded.</p>
        ) : null}
        <ul className="space-y-3">
          {data?.items.map((entry) => (
            <li key={entry.id} className="rounded-lg border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{entry.changedByName ?? entry.changedBy}</span>
                <time className="text-xs text-muted-foreground">
                  {new Date(entry.changedAt).toLocaleString()}
                </time>
              </div>
              {entry.reason ? <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p> : null}
              <div className="mt-2 grid gap-2 rounded-md bg-muted/40 p-2 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground">From: </span>
                  {formatHistoryValue(entry.oldValue, settingKey)}
                </div>
                <div>
                  <span className="text-muted-foreground">To: </span>
                  {formatHistoryValue(entry.newValue, settingKey)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function formatHistoryValue(value: unknown, settingKey?: string): string {
  if (value === null || value === undefined) return '—';
  if (settingKey && /secret|password|token|key|credential/i.test(settingKey)) {
    return '••••••••';
  }
  if (typeof value === 'object') return '[complex value]';
  const text = String(value);
  if (/secret|password|token|credential/i.test(text)) {
    return '••••••••';
  }
  if (text.length > 48 && /^[A-Za-z0-9+/=_:-]+$/.test(text)) {
    return '••••••••';
  }
  return text;
}
