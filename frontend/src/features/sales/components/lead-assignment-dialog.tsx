import { useState } from 'react';
import { useAssignLead } from '@/features/sales/hooks/use-sales';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { EmployeeSearchSelect } from '@/shared/components/employee-search-select';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';

const ASSIGNMENT_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'manager_override', label: 'Manager Override' },
];

interface LeadAssignmentDialogProps {
  open: boolean;
  leadId: string;
  currentAssigneeId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeadAssignmentDialog({
  open,
  leadId,
  currentAssigneeId,
  onClose,
  onSuccess,
}: LeadAssignmentDialogProps) {
  const assignLead = useAssignLead();
  const [assignedToId, setAssignedToId] = useState(currentAssigneeId ?? '');
  const [reason, setReason] = useState('');
  const [assignmentType, setAssignmentType] = useState<'manual' | 'manager_override'>('manual');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (assignLead.isPending) {
      return;
    }
    if (!assignedToId.trim()) {
      setError('Select an assignee before submitting.');
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Lead assigned successfully.',
      mutation: () =>
        assignLead.mutateAsync({
          id: leadId,
          payload: { assignedToId: assignedToId.trim(), reason: reason || undefined, assignmentType },
        }),
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Assign Lead"
      description="Route this lead to the right owner."
      submitLabel="Assign"
      isSubmitting={assignLead.isPending}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <FormSection title={FORM_SECTIONS.RELATIONSHIPS}>
          <SelectField label="Assignee" required>
            <EmployeeSearchSelect value={assignedToId} onChange={setAssignedToId} required />
          </SelectField>

          <SelectField label="Assignment Type">
            <AsyncSearchSelect
              value={assignmentType}
              options={ASSIGNMENT_TYPE_OPTIONS}
              onChange={(value) => setAssignmentType(value as 'manual' | 'manager_override')}
              clearable={false}
            />
          </SelectField>
        </FormSection>

        <FormSection title={FORM_SECTIONS.ADDITIONAL}>
          <SelectField label="Reason">
            <textarea
              className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional context for this assignment"
            />
          </SelectField>
        </FormSection>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormDialog>
  );
}
