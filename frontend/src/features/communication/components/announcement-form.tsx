import { FormEvent, useState } from 'react';
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  CreateAnnouncementPayload,
} from '@/features/communication/api/communication.api';
import { Button } from '@/shared/components/ui/button';

const AUDIENCES: AnnouncementAudience[] = ['all', 'department', 'branch', 'role', 'team', 'project'];
const PRIORITIES: AnnouncementPriority[] = ['low', 'normal', 'high', 'urgent'];

interface AnnouncementFormProps {
  initial?: Partial<Announcement>;
  onSubmit: (payload: CreateAnnouncementPayload) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
}

export function AnnouncementForm({ initial, onSubmit, onCancel, isPending }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>(initial?.targetAudience ?? 'all');
  const [priority, setPriority] = useState<AnnouncementPriority>(initial?.priority ?? 'normal');
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt?.slice(0, 16) ?? '');
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt?.slice(0, 16) ?? '');
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [isEmergency, setIsEmergency] = useState(initial?.isEmergency ?? false);
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(initial?.requiresAcknowledgement ?? false);
  const [templateSlug, setTemplateSlug] = useState(initial?.templateSlug ?? '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      title,
      content,
      targetAudience,
      priority,
      scheduledAt: scheduledAt || undefined,
      expiresAt: expiresAt || undefined,
      isPinned,
      isEmergency,
      requiresAcknowledgement,
      templateSlug: templateSlug || undefined,
    });
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

      <Field label="Content" className="sm:col-span-2">
        <textarea
          className="min-h-[120px] w-full rounded-md border p-2 text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </Field>

      <Field label="Audience">
        <select
          className="w-full rounded-md border p-2 text-sm"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value as AnnouncementAudience)}
        >
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Priority">
        <select
          className="w-full rounded-md border p-2 text-sm"
          value={priority}
          onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Schedule At">
        <input
          type="datetime-local"
          className="w-full rounded-md border p-2 text-sm"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </Field>

      <Field label="Expires At">
        <input
          type="datetime-local"
          className="w-full rounded-md border p-2 text-sm"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </Field>

      <Field label="Template Slug">
        <input
          className="w-full rounded-md border p-2 text-sm"
          value={templateSlug}
          onChange={(e) => setTemplateSlug(e.target.value)}
          placeholder="general, policy, emergency, holiday"
        />
      </Field>

      <div className="flex flex-wrap gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          Pinned
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
          Emergency
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
