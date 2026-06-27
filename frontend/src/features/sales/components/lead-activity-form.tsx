import { FormEvent, useState } from 'react';
import { useCreateActivity, useCreateCallLog, useCreateFollowUp } from '@/features/sales/hooks/use-sales';
import { DateTimePicker, dateTimePickerValueToIso } from '@/shared/components/datetime-picker';
import { DurationInput } from '@/shared/components/duration-input';
import { Button } from '@/shared/components/ui/button';

type ActivityTab = 'note' | 'call' | 'meeting' | 'follow_up';

interface LeadActivityFormProps {
  leadId: string;
  onSuccess?: () => void;
}

export function LeadActivityForm({ leadId, onSuccess }: LeadActivityFormProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('note');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [outcome, setOutcome] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createActivity = useCreateActivity();
  const createCallLog = useCreateCallLog();
  const createFollowUp = useCreateFollowUp();

  const isPending = createActivity.isPending || createCallLog.isPending || createFollowUp.isPending;

  const resetForm = () => {
    setDescription('');
    setTitle('');
    setScheduledAt('');
    setDurationSeconds(0);
    setOutcome('');
    setError(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (activeTab === 'note') {
        await createActivity.mutateAsync({ leadId, type: 'note', description, title: title || undefined });
      } else if (activeTab === 'meeting') {
        await createActivity.mutateAsync({ leadId, type: 'meeting', description, title: title || undefined });
      } else if (activeTab === 'call') {
        await createCallLog.mutateAsync({ leadId, direction, durationSeconds, notes: description, outcome: outcome || undefined });
        await createActivity.mutateAsync({ leadId, type: 'call', description: description || `Call (${direction})`, title: outcome || 'Call logged' });
      } else if (activeTab === 'follow_up') {
        if (!scheduledAt) {
          setError('Scheduled date is required');
          return;
        }
        await createFollowUp.mutateAsync({ leadId, scheduledAt: dateTimePickerValueToIso(scheduledAt), notes: description });
      }
      resetForm();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log activity');
    }
  };

  const tabs: { id: ActivityTab; label: string }[] = [
    { id: 'note', label: 'Note' },
    { id: 'call', label: 'Call' },
    { id: 'meeting', label: 'Meeting' },
    { id: 'follow_up', label: 'Follow-up' },
  ];

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {(activeTab === 'note' || activeTab === 'meeting') && (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Title</span>
          <input className="w-full rounded-md border p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      )}

      {activeTab === 'call' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Direction</span>
            <select className="w-full rounded-md border p-2" value={direction} onChange={(e) => setDirection(e.target.value as 'inbound' | 'outbound')}>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Duration (seconds)</span>
            <DurationInput value={durationSeconds} onChange={(value) => setDurationSeconds(value ?? 0)} min={0} max={86400} suffix="sec" />
          </label>
          <label className="col-span-full block space-y-1 text-sm">
            <span className="font-medium">Outcome</span>
            <input className="w-full rounded-md border p-2" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
          </label>
        </div>
      )}

      {activeTab === 'follow_up' && (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Scheduled At</span>
          <DateTimePicker value={scheduledAt} onChange={setScheduledAt} required />
        </label>
      )}

      <label className="block space-y-1 text-sm">
        <span className="font-medium">{activeTab === 'follow_up' ? 'Notes' : 'Description'}</span>
        <textarea
          className="w-full rounded-md border p-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={activeTab !== 'call'}
        />
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Log Activity'}
      </Button>
    </form>
  );
}
