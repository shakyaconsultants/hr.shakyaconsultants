import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, Megaphone, MessageSquare, Search, Settings } from 'lucide-react';
import { AnnouncementForm } from '@/features/communication/components/announcement-form';
import { NotificationList } from '@/features/communication/components/notification-list';
import {
  useAnnouncementHistory,
  useAnnouncements,
  useCommunicationNotifications,
  useCommunicationPolicies,
  useCommunicationSettings,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useEnterpriseCommunicationDashboard,
  useMarkCommunicationNotificationRead,
  usePublishAnnouncement,
  useUpdateCommunicationPolicies,
  useUpdateCommunicationSettings,
} from '@/features/communication/hooks/use-communication';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Announcements', 'Policies & Templates', 'Broadcast History', 'Notifications'] as const;

export function CommunicationEnterprisePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [showForm, setShowForm] = useState(false);
  const [statsId, setStatsId] = useState('');

  const { data: dashboard, isLoading } = useEnterpriseCommunicationDashboard();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements({ pageSize: 50 });
  const { data: history, isLoading: historyLoading } = useAnnouncementHistory({ pageSize: 50 });
  const { data: policies } = useCommunicationPolicies();
  const { data: settings } = useCommunicationSettings();
  const { data: notifications } = useCommunicationNotifications({ pageSize: 20 });
  const createAnnouncement = useCreateAnnouncement();
  const publishAnnouncement = usePublishAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const updatePolicies = useUpdateCommunicationPolicies();
  const updateSettings = useUpdateCommunicationSettings();
  const markRead = useMarkCommunicationNotificationRead();

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading communication admin..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <MessageSquare className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Communication Center</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage announcements, policies, broadcast history, and notifications.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={ROUTES.COMMUNICATION_SEARCH}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'Overview' && dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={Megaphone} label="Active Announcements" value={dashboard.totalAnnouncements} />
          <StatCard icon={MessageSquare} label="Active Channels" value={dashboard.activeChannels} />
          <StatCard icon={Bell} label="Notifications" value={dashboard.totalNotifications} />
          <StatCard icon={FileText} label="Total Messages" value={dashboard.totalMessages} />
          <StatCard icon={Megaphone} label="Announcement Reads" value={dashboard.announcementReads} />
          <StatCard icon={Bell} label="Emergency Alerts" value={dashboard.emergencyAnnouncements} />
        </div>
      ) : null}

      {activeTab === 'Announcements' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Announcements</h2>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Hide Form' : 'New Announcement'}
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
              { key: 'targetAudience', header: 'Audience' },
              { key: 'status', header: 'Status' },
              {
                key: 'isEmergency',
                header: 'Emergency',
                render: (row) => (row.isEmergency ? 'Yes' : 'No'),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => void publishAnnouncement.mutateAsync(row.id)}>
                      Publish
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatsId(row.id)}>
                      Stats
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void deleteAnnouncement.mutateAsync(row.id)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={announcements?.items ?? []}
            isLoading={announcementsLoading}
            emptyMessage="No announcements configured"
          />
          {statsId ? (
            <p className="text-sm text-muted-foreground">
              View delivery stats on the Broadcast History tab for announcement {statsId}.
            </p>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'Policies & Templates' ? (
        <section className="space-y-6 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h2 className="font-semibold">Communication Policies</h2>
          </div>
          {policies ? (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                void updatePolicies.mutateAsync({
                  allowDirectMessages: (form.elements.namedItem('allowDirectMessages') as HTMLInputElement).checked,
                  allowPrivateChannels: (form.elements.namedItem('allowPrivateChannels') as HTMLInputElement).checked,
                  allowEmployeeChannels: (form.elements.namedItem('allowEmployeeChannels') as HTMLInputElement).checked,
                  requireAcknowledgementDefault: (form.elements.namedItem('requireAcknowledgementDefault') as HTMLInputElement)
                    .checked,
                  emergencyBypassQuietHours: (form.elements.namedItem('emergencyBypassQuietHours') as HTMLInputElement).checked,
                  maxAttachmentSizeMb: Number(
                    (form.elements.namedItem('maxAttachmentSizeMb') as HTMLInputElement).value,
                  ),
                  messageRetentionDays: Number(
                    (form.elements.namedItem('messageRetentionDays') as HTMLInputElement).value,
                  ),
                });
              }}
            >
              <PolicyCheckbox name="allowDirectMessages" label="Allow direct messages" defaultChecked={policies.allowDirectMessages} />
              <PolicyCheckbox name="allowPrivateChannels" label="Allow private channels" defaultChecked={policies.allowPrivateChannels} />
              <PolicyCheckbox name="allowEmployeeChannels" label="Allow employee channels" defaultChecked={policies.allowEmployeeChannels} />
              <PolicyCheckbox name="requireAcknowledgementDefault" label="Require acknowledgement by default" defaultChecked={policies.requireAcknowledgementDefault} />
              <PolicyCheckbox name="emergencyBypassQuietHours" label="Emergency bypass quiet hours" defaultChecked={policies.emergencyBypassQuietHours} />
              <label>
                <span className="mb-1 block text-sm font-medium">Max attachment size (MB)</span>
                <input name="maxAttachmentSizeMb" type="number" className="w-full rounded-md border p-2 text-sm" defaultValue={policies.maxAttachmentSizeMb} />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Message retention (days)</span>
                <input name="messageRetentionDays" type="number" className="w-full rounded-md border p-2 text-sm" defaultValue={policies.messageRetentionDays} />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={updatePolicies.isPending}>
                  {updatePolicies.isPending ? 'Saving...' : 'Save Policies'}
                </Button>
              </div>
            </form>
          ) : null}

          <div>
            <h3 className="mb-2 font-medium">Announcement Templates</h3>
            {settings?.templates?.length ? (
              <ul className="divide-y rounded-lg border">
                {settings.templates.map((template) => (
                  <li key={template.slug} className="px-4 py-3">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Default templates: general, policy, emergency, holiday</p>
            )}
            <Button
              className="mt-4"
              size="sm"
              variant="outline"
              disabled={updateSettings.isPending}
              onClick={() =>
                void updateSettings.mutateAsync({
                  templates: settings?.templates ?? [],
                })
              }
            >
              Refresh Templates
            </Button>
          </div>
        </section>
      ) : null}

      {activeTab === 'Broadcast History' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Broadcast History & Delivery Statistics</h2>
          <DataTable
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'priority', header: 'Priority' },
              { key: 'publishedAt', header: 'Published', render: (row) => row.publishedAt ? new Date(row.publishedAt).toLocaleString() : '—' },
              { key: 'status', header: 'Status' },
              { key: 'targetAudience', header: 'Audience' },
            ]}
            data={history?.items ?? []}
            isLoading={historyLoading}
            emptyMessage="No broadcast history"
          />
        </section>
      ) : null}

      {activeTab === 'Notifications' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Notification Management</h2>
          <NotificationList
            notifications={notifications?.items ?? []}
            onMarkRead={(id) => markRead.mutate(id)}
            emptyTitle="No system notifications"
          />
        </section>
      ) : null}
    </div>
  );
}

function PolicyCheckbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
