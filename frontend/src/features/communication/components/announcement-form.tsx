import { FormEvent, useState } from 'react';
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  CreateAnnouncementPayload,
} from '@/features/communication/api/communication.api';
import { AnnouncementAudienceFields } from '@/features/communication/components/announcement-audience-fields';
import { DateTimePicker, dateTimePickerValueToIso } from '@/shared/components/datetime-picker';
import { SelectField } from '@/shared/components/select-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { formCheckboxClassName } from '@/shared/utils/form-control';
import { toDateTimeLocalValue } from '@/shared/utils/datetime';

const PRIORITIES: AnnouncementPriority[] = ['low', 'normal', 'high', 'urgent'];

interface AnnouncementFormProps {
  initial?: Partial<Announcement>;
  onSubmit: (payload: CreateAnnouncementPayload) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  lockAudience?: AnnouncementAudience;
}

export function AnnouncementForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  lockAudience,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>(
    lockAudience ?? initial?.targetAudience ?? 'all',
  );
  const [targetIds, setTargetIds] = useState<string[]>(initial?.targetIds ?? []);
  const [secondaryTargetIds, setSecondaryTargetIds] = useState<string[]>(
    initial?.secondaryTargetIds ?? [],
  );
  const [priority, setPriority] = useState<AnnouncementPriority>(initial?.priority ?? 'normal');
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocalValue(initial?.scheduledAt));
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocalValue(initial?.expiresAt));
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [isEmergency, setIsEmergency] = useState(initial?.isEmergency ?? false);
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(
    initial?.requiresAcknowledgement ?? false,
  );
  const [templateSlug, setTemplateSlug] = useState(initial?.templateSlug ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const audience = lockAudience ?? targetAudience;
    if (audience !== 'all' && audience !== 'team' && targetIds.length === 0) {
      setError('Select at least one target for the chosen audience.');
      return;
    }
    if (audience === 'department_role' && secondaryTargetIds.length === 0) {
      setError('Select at least one designation for department & designation audience.');
      return;
    }

    await onSubmit({
      title,
      content,
      targetAudience: audience,
      targetIds: audience === 'all' ? [] : targetIds,
      secondaryTargetIds: audience === 'department_role' ? secondaryTargetIds : [],
      priority,
      scheduledAt: scheduledAt ? dateTimePickerValueToIso(scheduledAt) : undefined,
      expiresAt: expiresAt ? dateTimePickerValueToIso(expiresAt) : undefined,
      isPinned,
      isEmergency,
      requiresAcknowledgement,
      templateSlug: templateSlug || undefined,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
      {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}

      <div className="sm:col-span-2">
        <SelectField label="Title" htmlFor="announcement-title" required>
          <Input
            id="announcement-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </SelectField>
      </div>

      <div className="sm:col-span-2">
        <SelectField label="Content" htmlFor="announcement-content" required>
          <Textarea
            id="announcement-content"
            className="min-h-[120px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </SelectField>
      </div>

      <AnnouncementAudienceFields
        targetAudience={targetAudience}
        targetIds={targetIds}
        secondaryTargetIds={secondaryTargetIds}
        onAudienceChange={setTargetAudience}
        onTargetIdsChange={setTargetIds}
        onSecondaryTargetIdsChange={setSecondaryTargetIds}
        lockAudience={lockAudience}
      />

      <SelectField label="Priority" htmlFor="announcement-priority">
        <Select
          id="announcement-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </SelectField>

      <SelectField label="Schedule At">
        <DateTimePicker
          value={scheduledAt}
          onChange={setScheduledAt}
          min={toDateTimeLocalValue(new Date())}
        />
      </SelectField>

      <SelectField label="Expires At">
        <DateTimePicker value={expiresAt} onChange={setExpiresAt} min={scheduledAt || undefined} />
      </SelectField>

      <SelectField
        label="Template Slug"
        htmlFor="announcement-template"
        hint="general, policy, emergency, holiday"
      >
        <Input
          id="announcement-template"
          value={templateSlug}
          onChange={(e) => setTemplateSlug(e.target.value)}
          placeholder="general, policy, emergency, holiday"
        />
      </SelectField>

      <div className="flex flex-wrap gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className={formCheckboxClassName}
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          Pinned
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className={formCheckboxClassName}
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
          />
          Emergency
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className={formCheckboxClassName}
            checked={requiresAcknowledgement}
            onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
          />
          Requires acknowledgement
        </label>
      </div>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : initial?.title ? 'Update' : 'Create'}
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
