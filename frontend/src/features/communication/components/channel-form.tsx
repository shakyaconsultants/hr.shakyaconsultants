import { FormEvent, useState } from 'react';
import type {
  ChannelSubtype,
  CreateChannelPayload,
} from '@/features/communication/api/communication.api';
import { SelectField } from '@/shared/components/select-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { formCheckboxClassName } from '@/shared/utils/form-control';

const SUBTYPES: ChannelSubtype[] = [
  'project',
  'department',
  'team',
  'announcement',
  'read_only',
  'private',
];

interface ChannelFormProps {
  initial?: {
    title?: string;
    description?: string;
    channelSubtype?: ChannelSubtype;
    isReadOnly?: boolean;
    isPrivate?: boolean;
  };
  onSubmit: (payload: CreateChannelPayload) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  showParticipants?: boolean;
}

export function ChannelForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  showParticipants = true,
}: ChannelFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [channelSubtype, setChannelSubtype] = useState<ChannelSubtype>(
    initial?.channelSubtype ?? 'team',
  );
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
        ? participantIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [],
      isReadOnly,
      isPrivate,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <SelectField label="Title" htmlFor="channel-title" required>
          <Input
            id="channel-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </SelectField>
      </div>

      <div className="sm:col-span-2">
        <SelectField label="Description" htmlFor="channel-description">
          <Textarea
            id="channel-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </SelectField>
      </div>

      <SelectField label="Channel Type" htmlFor="channel-type">
        <Select
          id="channel-type"
          value={channelSubtype}
          onChange={(e) => setChannelSubtype(e.target.value as ChannelSubtype)}
        >
          {SUBTYPES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </SelectField>

      {showParticipants ? (
        <div className="sm:col-span-2">
          <SelectField label="Participant IDs (comma-separated)" htmlFor="channel-participants">
            <Input
              id="channel-participants"
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              placeholder="uuid1, uuid2"
            />
          </SelectField>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className={formCheckboxClassName}
            checked={isReadOnly}
            onChange={(e) => setIsReadOnly(e.target.checked)}
          />
          Read only
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className={formCheckboxClassName}
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
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
