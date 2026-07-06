import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useCreateInterview } from '@/features/recruitment/hooks/use-recruitment';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { SelectField } from '@/shared/components/select-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'In Person' },
  { value: 'technical', label: 'Technical' },
  { value: 'hr', label: 'HR Round' },
  { value: 'managerial', label: 'Managerial' },
  { value: 'panel', label: 'Panel' },
];

export interface ScheduleInterviewPanelProps {
  candidateId: string;
  defaultDesignationId?: string;
  nextRound?: number;
  onScheduled?: () => void;
}

export function ScheduleInterviewPanel({
  candidateId,
  defaultDesignationId = '',
  nextRound = 1,
  onScheduled,
}: ScheduleInterviewPanelProps) {
  const createMutation = useCreateInterview();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    designationId: defaultDesignationId,
    interviewType: 'online',
    scheduledAt: '',
    durationMinutes: '45',
    meetingLink: '',
    notes: '',
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.designationId || !form.scheduledAt) {
      setError('Designation and date/time are required.');
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Interview scheduled. Candidate will receive an invite email.',
      mutation: () =>
        createMutation.mutateAsync({
          candidateLeadId: candidateId,
          designationId: form.designationId,
          round: nextRound,
          interviewType: form.interviewType,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 45,
          meetingLink: form.meetingLink || undefined,
          notes: form.notes || undefined,
        }),
      onSuccess: () => {
        setForm((prev) => ({ ...prev, scheduledAt: '', meetingLink: '', notes: '' }));
        onScheduled?.();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-dashed p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        <p className="font-medium">Schedule Interview (Round {nextRound})</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Designation" htmlFor="interview-designation" required>
          <MasterDataSelect
            id="interview-designation"
            entityKey="designation"
            value={form.designationId}
            onChange={(value) => setForm((prev) => ({ ...prev, designationId: value }))}
            required
          />
        </SelectField>
        <SelectField label="Interview Type" required>
          <AsyncSearchSelect
            value={form.interviewType}
            options={INTERVIEW_TYPE_OPTIONS}
            onChange={(value) => setForm((prev) => ({ ...prev, interviewType: value }))}
            clearable={false}
          />
        </SelectField>
        <SelectField label="Date & Time" htmlFor="interview-datetime" required>
          <Input
            id="interview-datetime"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
            required
          />
        </SelectField>
        <SelectField label="Duration (minutes)" htmlFor="interview-duration">
          <Input
            id="interview-duration"
            type="number"
            min={15}
            step={15}
            value={form.durationMinutes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))
            }
          />
        </SelectField>
        <SelectField label="Meeting Link" htmlFor="interview-link">
          <Input
            id="interview-link"
            type="url"
            placeholder="https://meet.google.com/..."
            value={form.meetingLink}
            onChange={(event) => setForm((prev) => ({ ...prev, meetingLink: event.target.value }))}
          />
        </SelectField>
        <div className="sm:col-span-2">
          <SelectField label="Notes" htmlFor="interview-notes">
            <Input
              id="interview-notes"
              placeholder="Optional notes for the interview panel"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </SelectField>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="mt-3" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Scheduling...' : 'Schedule & Send Invite'}
      </Button>
    </form>
  );
}
