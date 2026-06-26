import { useState } from 'react';
import { useMyTasks, useMyTasksKanban, useBulkUpdateTasks, useQuickUpdateTask } from '@/features/workspace/hooks/use-workspace';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

type View = 'list' | 'kanban';
type Filter = 'pending' | 'completed' | 'waiting_verification' | 'rejected' | '';

export function WorkspaceTasksPage() {
  const [view, setView] = useState<View>('list');
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: tasks, isLoading } = useMyTasks({ status: filter || undefined, search: search || undefined });
  const { data: kanban, isLoading: kanbanLoading } = useMyTasksKanban();
  const bulkUpdate = useBulkUpdateTasks();
  const quickUpdate = useQuickUpdateTask();

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Tasks" description="Kanban, list views, filters, and bulk actions." />
      <WorkspaceNav />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(['list', 'kanban'] as View[]).map((v) => (
            <Button key={v} variant={view === v ? 'default' : 'outline'} size="sm" onClick={() => setView(v)}>{v}</Button>
          ))}
        </div>
        <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="waiting_verification">Waiting Verification</option>
          <option value="rejected">Rejected</option>
        </select>
        {selected.length > 0 && (
          <Button size="sm" onClick={() => bulkUpdate.mutate({ taskIds: selected, status: 'in_progress' })}>
            Mark {selected.length} In Progress
          </Button>
        )}
      </div>

      {view === 'list' && (
        isLoading ? <Loading message="Loading tasks..." /> : (
          (tasks?.items.length ?? 0) === 0 ? <EmptyState title="No tasks found" /> : (
            <ul className="divide-y rounded-lg border bg-card">
              {tasks?.items.map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(task.id)}
                    onChange={(e) => setSelected(e.target.checked ? [...selected, task.id] : selected.filter((id) => id !== task.id))}
                    aria-label={`Select ${task.title}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.status} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => quickUpdate.mutate({ id: task.id, payload: { status: 'completed' } })}>
                    Complete
                  </Button>
                </li>
              ))}
            </ul>
          )
        )
      )}

      {view === 'kanban' && (
        kanbanLoading ? <Loading message="Loading kanban..." /> : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanban?.columns ?? {}).map(([status, items]) => (
              <div key={status} className="min-w-[240px] rounded-lg border bg-muted/30 p-3">
                <h3 className="mb-2 text-sm font-semibold capitalize">{status.replace(/_/g, ' ')}</h3>
                <ul className="space-y-2">
                  {items.map((task) => (
                    <li key={task.id} className="rounded border bg-card p-3 text-sm shadow-sm">
                      <p className="font-medium">{task.title}</p>
                      {task.dueDate && <p className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      )}

      <p className="text-xs text-muted-foreground">Timer tracking — coming soon</p>
    </div>
  );
}
