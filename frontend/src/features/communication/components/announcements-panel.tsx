import { useState } from 'react';
import { AnnouncementForm } from '@/features/communication/components/announcement-form';
import { ANNOUNCEMENT_AUDIENCE_OPTIONS } from '@/features/communication/components/announcement-audience-fields';
import {
  useAnnouncements,
  useAcknowledgeAnnouncement,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  usePublishAnnouncement,
} from '@/features/communication/hooks/use-communication';
import { useAuthStore } from '@/shared/stores/app.store';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function AnnouncementsPanel() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('notifications.broadcast');

  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useAnnouncements({ pageSize: 50 });
  const createAnnouncement = useCreateAnnouncement();
  const publishAnnouncement = usePublishAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const acknowledge = useAcknowledgeAnnouncement();

  if (isLoading) {
    return <Loading message="Loading announcements…" />;
  }

  const items = data?.items ?? [];

  if (!canManage) {
    if (items.length === 0) {
      return (
        <EmptyState
          title="No announcements"
          description="Company announcements will appear here."
        />
      );
    }

    return (
      <ul className="space-y-4">
        {items.map((announcement) => (
          <li key={announcement.id} className="rounded-xl border bg-card p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                {announcement.priority}
              </span>
              {announcement.isEmergency ? (
                <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  Emergency
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold">{announcement.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {announcement.content}
            </p>
            {!announcement.isAcknowledged && announcement.requiresAcknowledgement !== false ? (
              <Button
                size="sm"
                className="mt-4"
                disabled={acknowledge.isPending}
                onClick={() => acknowledge.mutate(announcement.id)}
              >
                Acknowledge
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Publish company-wide or targeted announcements for employees.
        </p>
        <Button size="sm" onClick={() => setShowForm((open) => !open)}>
          {showForm ? 'Hide form' : 'New announcement'}
        </Button>
      </div>

      {showForm ? (
        <AnnouncementForm
          isPending={createAnnouncement.isPending}
          onSubmit={async (payload) => {
            await createAnnouncement.mutateAsync(payload);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      <DataTable
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'priority', header: 'Priority' },
          {
            key: 'targetAudience',
            header: 'Audience',
            render: (row) =>
              ANNOUNCEMENT_AUDIENCE_OPTIONS.find((option) => option.value === row.targetAudience)
                ?.label ?? row.targetAudience,
          },
          { key: 'status', header: 'Status' },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void publishAnnouncement.mutateAsync(row.id)}
                >
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void deleteAnnouncement.mutateAsync(row.id)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={items}
        emptyMessage="No announcements yet"
      />
    </div>
  );
}
