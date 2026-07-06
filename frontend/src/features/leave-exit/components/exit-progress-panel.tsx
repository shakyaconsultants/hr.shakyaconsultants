import { useState } from 'react';
import { useCompleteExitItem, useExitProcess } from '@/features/leave-exit/hooks/use-leave-exit';
import { StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

export function ExitProgressPanel() {
  const [processId, setProcessId] = useState('');
  const [queryId, setQueryId] = useState('');
  const { data, isLoading, isFetching } = useExitProcess(queryId);
  const complete = useCompleteExitItem();

  const loadProcess = () => setQueryId(processId.trim());

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track HR, IT, finance, and admin clearance after a resignation is approved.
      </p>
      <div className="flex max-w-lg gap-2">
        <input
          className="flex-1 rounded-md border p-2 text-sm"
          placeholder="Exit process ID"
          value={processId}
          onChange={(e) => setProcessId(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={loadProcess}>
          Load
        </Button>
      </div>

      {isLoading || isFetching ? <Loading message="Loading exit process..." /> : null}

      {data ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Process {data.id.slice(0, 8)}…</h2>
            <StatusBadge status={data.status} />
          </div>

          <div className="space-y-2">
            {(data.items ?? [])
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.status !== 'completed' ? (
                      <Button
                        size="sm"
                        disabled={complete.isPending}
                        onClick={() => void complete.mutateAsync({ id: item.id })}
                      >
                        Mark Complete
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : queryId ? (
        <p className="text-muted-foreground">No exit process found for this ID.</p>
      ) : (
        <p className="text-muted-foreground">
          Enter an exit process ID to view clearance progress.
        </p>
      )}
    </div>
  );
}
