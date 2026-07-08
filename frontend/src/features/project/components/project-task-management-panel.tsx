import { useState } from 'react';
import { Check, Plus, RotateCcw, X } from 'lucide-react';
import {
  useApproveTaskVerification,
  useCreateTask,
  useRejectTaskVerification,
  useTaskVerifications,
  useUpdateTask,
} from '@/features/project/hooks/use-projects';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import type { TaskRecord } from '@/features/project/api/project.api';
import { DEFAULT_TASK_PRIORITY } from '@/features/project/constants/task-priority';
import { TaskPriorityBadge } from '@/features/project/components/task-priority-badge';
import { TaskPrioritySelect } from '@/features/project/components/task-priority-select';
import { Button } from '@/shared/components/ui/button';
import { DatePicker } from '@/shared/components/date-picker';
import { Input } from '@/shared/components/ui/input';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

interface TaskVerificationRecord {
  id: string;
  taskId: string;
  status: string;
  comment?: string;
  revisionNotes?: string;
  createdAt: string;
}

interface Props {
  projectId: string;
  projectManagerId: string;
  tasks: TaskRecord[];
  canManage: boolean;
}

function formatStatus(slug: string): string {
  return slug
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function ProjectTaskManagementPanel({
  projectId,
  projectManagerId,
  tasks,
  canManage,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState(DEFAULT_TASK_PRIORITY);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState<Record<string, string>>({});

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const approveMutation = useApproveTaskVerification();
  const rejectMutation = useRejectTaskVerification();
  const { data: employees } = useAllEmployees({ status: 'active' });

  const employeeMap = new Map(
    (employees ?? []).map((e) => [e.id, `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim()]),
  );

  async function handleCreateTask() {
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    setError(null);
    await runFormMutation({
      setError,
      successMessage: 'Task assigned successfully.',
      mutation: () =>
        createTaskMutation.mutateAsync({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          assigneeId: assigneeId || undefined,
          verifierId: projectManagerId,
          priority,
          dueDate: dueDate || undefined,
          status: 'todo',
        }),
      onSuccess: () => {
        setShowCreate(false);
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setPriority(DEFAULT_TASK_PRIORITY);
        setDueDate('');
      },
    });
  }

  async function markCompleted(task: TaskRecord) {
    await runFormMutation({
      setError,
      successMessage: 'Task submitted for verification.',
      mutation: () =>
        updateTaskMutation.mutateAsync({
          id: task.id,
          payload: { status: 'completed' },
        }),
    });
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" /> Assign Task
          </Button>
        </div>
      )}

      {showCreate && canManage && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Title *</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Description</span>
              <textarea
                className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Priority</span>
              <TaskPrioritySelect value={priority} onChange={setPriority} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Assign To</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {(employees ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Deadline</span>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleCreateTask()}
              disabled={createTaskMutation.isPending}
            >
              Create & Assign
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ul className="space-y-3">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            assigneeName={
              task.assigneeId ? (employeeMap.get(task.assigneeId) ?? task.assigneeId) : 'Unassigned'
            }
            canManage={canManage}
            rejectComment={rejectComment[task.id] ?? ''}
            onRejectCommentChange={(value) =>
              setRejectComment((prev) => ({ ...prev, [task.id]: value }))
            }
            onMarkCompleted={() => void markCompleted(task)}
            onApprove={async (verificationId) => {
              await runFormMutation({
                setError,
                successMessage: 'Task approved.',
                mutation: () => approveMutation.mutateAsync({ verificationId }),
              });
            }}
            onReject={async (verificationId) => {
              const comment = rejectComment[task.id]?.trim();
              if (!comment) {
                setError('Rejection comment is required.');
                return;
              }
              await runFormMutation({
                setError,
                successMessage: 'Task sent back to employee.',
                mutation: () => rejectMutation.mutateAsync({ verificationId, comment }),
              });
            }}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tasks yet. Assign the first task to get started.
          </p>
        )}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  assigneeName,
  canManage,
  rejectComment,
  onRejectCommentChange,
  onMarkCompleted,
  onApprove,
  onReject,
}: {
  task: TaskRecord;
  assigneeName: string;
  canManage: boolean;
  rejectComment: string;
  onRejectCommentChange: (value: string) => void;
  onMarkCompleted: () => void;
  onApprove: (verificationId: string) => Promise<void>;
  onReject: (verificationId: string) => Promise<void>;
}) {
  const { data: verifications = [] } = useTaskVerifications(task.id);
  const pending = (verifications as TaskVerificationRecord[]).find((v) => v.status === 'pending');

  return (
    <li className="rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{task.title}</p>
          {task.description && <p className="mt-1 text-muted-foreground">{task.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TaskPriorityBadge priority={task.priority} />
            <p className="text-xs text-muted-foreground">
              {assigneeName} · {formatStatus(task.status)}
              {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <span className="rounded bg-muted px-2 py-0.5 text-xs">{formatStatus(task.status)}</span>
      </div>

      {canManage && pending && (
        <div className="mt-3 space-y-2 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            Pending verification
          </p>
          <Input
            placeholder="Rejection / revision notes (required to reject)"
            value={rejectComment}
            onChange={(e) => onRejectCommentChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => void onApprove(pending.id)}
            >
              <Check className="mr-1 h-3 w-3" /> Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={() => void onReject(pending.id)}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reject & Send Back
            </Button>
          </div>
        </div>
      )}

      {!canManage && task.status !== 'completed' && task.status !== 'verified' && (
        <div className="mt-3">
          <Button type="button" size="sm" variant="outline" onClick={onMarkCompleted}>
            <Check className="mr-1 h-3 w-3" /> Mark Complete
          </Button>
        </div>
      )}

      {task.status === 'rejected' && (
        <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
          <X className="h-3 w-3" /> Sent back for revision — check your notifications
        </p>
      )}
    </li>
  );
}
