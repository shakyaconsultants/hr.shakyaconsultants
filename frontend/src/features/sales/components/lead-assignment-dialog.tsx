import { FormEvent, useState } from 'react';
import { useAssignLead } from '@/features/sales/hooks/use-sales';
import { Button } from '@/shared/components/ui/button';

interface LeadAssignmentDialogProps {
  leadId: string;
  currentAssigneeId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeadAssignmentDialog({ leadId, currentAssigneeId, onClose, onSuccess }: LeadAssignmentDialogProps) {
  const assignLead = useAssignLead();
  const [assignedToId, setAssignedToId] = useState(currentAssigneeId ?? '');
  const [reason, setReason] = useState('');
  const [assignmentType, setAssignmentType] = useState<'manual' | 'manager_override'>('manual');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!assignedToId.trim()) {
      setError('Assignee employee ID is required');
      return;
    }
    setError(null);
    try {
      await assignLead.mutateAsync({
        id: leadId,
        payload: { assignedToId: assignedToId.trim(), reason: reason || undefined, assignmentType },
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign lead');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Assign Lead</h2>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Employee ID</span>
            <input
              className="w-full rounded-md border p-2"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              placeholder="Enter employee ID"
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Assignment Type</span>
            <select
              className="w-full rounded-md border p-2"
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value as 'manual' | 'manager_override')}
            >
              <option value="manual">Manual</option>
              <option value="manager_override">Manager Override</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Reason (optional)</span>
            <textarea
              className="w-full rounded-md border p-2"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for assignment"
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={assignLead.isPending}>
              {assignLead.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
