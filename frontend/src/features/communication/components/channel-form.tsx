import { FormEvent, useState } from 'react';
import type { ChannelSubtype, CreateChannelPayload } from '@/features/communication/api/communication.api';
import { Button } from '@/shared/components/ui/button';

const SUBTYPES: ChannelSubtype[] = ['project', 'department', 'team', 'announcement', 'read_only', 'private'];

interface ChannelFormProps {
  initial?: { title?: string; description?: string; channelSubtype?: ChannelSubtype; isReadOnly?: boolean; isPrivate?: boolean };
  onSubmit: (payload: CreateChannelPayload) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  showParticipants?: boolean;
}

export function ChannelForm({ initial, onSubmit, onCancel, isPending, showParticipants = true }: ChannelFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [channelSubtype, setChannelSubtype] = useState<ChannelSubtype>(initial?.channelSubtype ?? 'team');
  const [participantIds, setParticipantIds] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(initial?.isReadOnly ?? false);
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: CreateChannelPayload = {
      title,
      description: description || undefined,
      channelSubtype,
      participantIds: showParticipants
        ? participantIds.split(',').map((id) => id.trim()).filter(Boolean)
        : [],
      isReadOnly,
      isPrivate,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Title" className="sm:col-span-2">
        <input
          className="w-full rounded-md border p-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>

      <Field label="Description" className="sm:col-span-2">
        <textarea
          className="min-h-[80px] w-full rounded-md border p-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field label="Channel Type">
        <select
          className="w-full rounded-md border p-2 text-sm"
          value={channelSubtype}
          onChange={(e) => setChannelSubtype(e.target.value as ChannelSubtype)}
        >
          {SUBTYPES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </Field>

      {showParticipants ? (
        <Field label="Participant IDs (comma-separated)" className="sm:col-span-2">
          <input
            className="w-full rounded-md border p-2 text-sm"
            value={participantIds}
            onChange={(e) => setParticipantIds(e.target.value)}
            placeholder="uuid1, uuid2"
          />
        </Field>
      ) : null}

      <div className="flex flex-wrap gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isReadOnly} onChange={(e) => setIsReadOnly(e.target.checked)} />
          Read only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Private
        </label>
      </div>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Channel'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
