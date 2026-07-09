import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useMyTasks,
  useMyTasksKanban,
  useBulkUpdateTasks,
  useSubmitTaskForVerification,
} from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

type View = 'list' | 'kanban';
const VIEW_LABELS: Record<View, string> = {
  list: 'List',
  kanban: 'Board',
};
type Filter = 'pending' | 'completed' | 'waiting_verification' | 'rejected' | '';

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function canSubmit(status: string): boolean {
  return ['todo', 'assigned', 'in_progress', 'backlog', 'blocked', 'rejected'].includes(status);
}

export function WorkspaceTasksPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? undefined;
  const [view, setView] = useState<View>('list');
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: tasks, isLoading } = useMyTasks({
    status: filter || undefined,
    search: search || undefined,
    projectId,
  });
  const { data: kanban, isLoading: kanbanLoading } = useMyTasksKanban(projectId);
  const bulkUpdate = useBulkUpdateTasks();
  const submitMutation = useSubmitTaskForVerification();

  async function handleSubmit(taskId: string) {
    setError(null);
    await runFormMutation({
      setError,
      successMessage: 'Task submitted for verification.',
      mutation: () => submitMutation.mutateAsync(taskId),
    });
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="My Tasks"
        description={
          projectId
            ? 'Your tasks on this project — submit completed work for manager approval.'
            : 'View and submit your assigned tasks for verification.'
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(['list', 'kanban'] as View[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView(v)}
            >
              {VIEW_LABELS[v]}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Waiting Verification</option>
          <option value="waiting_verification">Submitted</option>
          <option value="rejected">Sent Back</option>
        </select>
        {selected.length > 0 && (
          <Button
            size="sm"
            onClick={() => bulkUpdate.mutate({ taskIds: selected, status: 'in_progress' })}
          >
            Mark {selected.length} In Progress
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {view === 'list' &&
        (isLoading ? (
          <Loading message="Loading tasks..." />
        ) : (tasks?.items.length ?? 0) === 0 ? (
          <EmptyState title="No tasks found" />
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {tasks?.items.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.includes(task.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, task.id]
                        : selected.filter((id) => id !== task.id),
                    )
                  }
                  aria-label={`Select ${task.title}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatStatus(task.status)} ·{' '}
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                  {task.status === 'rejected' && (
                    <p className="text-xs text-destructive">
                      Revision required — resubmit when ready
                    </p>
                  )}
                  {task.status === 'completed' && (
                    <p className="text-xs text-amber-600">Awaiting manager approval</p>
                  )}
                </div>
                {canSubmit(task.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitMutation.isPending}
                    onClick={() => void handleSubmit(task.id)}
                  >
                    Submit for Verification
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ))}

      {view === 'kanban' &&
        (kanbanLoading ? (
          <Loading message="Loading task board..." />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanban?.columns ?? {}).map(([status, items]) => (
              <div key={status} className="min-w-[240px] rounded-lg border bg-muted/30 p-3">
                <h3 className="mb-2 text-sm font-semibold capitalize">{formatStatus(status)}</h3>
                <ul className="space-y-2">
                  {items.map((task) => (
                    <li key={task.id} className="rounded border bg-card p-3 text-sm shadow-sm">
                      <p className="font-medium">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
