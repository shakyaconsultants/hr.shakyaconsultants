import { TaskPriorityBadge } from '@/features/project/components/task-priority-badge';
import {
  canSubmitTaskForVerification,
  formatProjectStatus,
} from '@/features/project/utils/project-display.util';
import { Button } from '@/shared/components/ui/button';

export interface ProjectMemberTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface ProjectMemberTasksPanelProps {
  tasks: ProjectMemberTaskItem[];
  onSubmitForVerification: (task: ProjectMemberTaskItem) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function ProjectMemberTasksPanel({
  tasks,
  onSubmitForVerification,
  isSubmitting = false,
  error,
  emptyMessage = 'No tasks assigned to you on this project yet.',
}: ProjectMemberTasksPanelProps) {
  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{task.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TaskPriorityBadge priority={task.priority} />
                <p className="text-xs text-muted-foreground">
                  {formatProjectStatus(task.status)}
                  {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                </p>
              </div>
              {task.status === 'rejected' && (
                <p className="mt-1 text-xs text-destructive">
                  Sent back for revision — update and resubmit
                </p>
              )}
              {task.status === 'completed' && (
                <p className="mt-1 text-xs text-amber-600">Waiting for manager verification</p>
              )}
              {task.status === 'verified' && (
                <p className="mt-1 text-xs text-green-600">Approved by manager</p>
              )}
            </div>
            {canSubmitTaskForVerification(task.status) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void onSubmitForVerification(task)}
              >
                Submit for Verification
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
