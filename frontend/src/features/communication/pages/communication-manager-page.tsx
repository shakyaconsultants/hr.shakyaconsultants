import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, MessageSquare, Users } from 'lucide-react';
import { AnnouncementForm } from '@/features/communication/components/announcement-form';
import { ChannelForm } from '@/features/communication/components/channel-form';
import {
  useAnnouncements,
  useChannels,
  useCreateAnnouncement,
  useCreateChannel,
  useDeleteChannel,
  useManagerCommunicationDashboard,
  useUpdateChannel,
} from '@/features/communication/hooks/use-communication';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Team Announcements', 'Team Channels', 'Team Read Status'] as const;

export function CommunicationManagerPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showChannelForm, setShowChannelForm] = useState(false);

  const { data: dashboard, isLoading } = useManagerCommunicationDashboard();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements({ pageSize: 50 });
  const { data: channels, isLoading: channelsLoading } = useChannels({ pageSize: 50, channelSubtype: 'team' });
  const createAnnouncement = useCreateAnnouncement();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading team communication..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Team Communication</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage team announcements, channels, and read status.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={ROUTES.COMMUNICATION_INBOX}>Inbox</Link>
        </Button>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Team Size" value={dashboard.teamSize ?? 0} />
          <StatCard icon={MessageSquare} label="Team Channels" value={dashboard.teamChannels} />
          <StatCard icon={Megaphone} label="Team Announcements" value={dashboard.teamAnnouncements} />
          <StatCard icon={Megaphone} label="Unread Notifications" value={dashboard.unreadNotifications} />
        </div>
      ) : null}

      {activeTab === 'Team Announcements' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Team Announcements</h2>
            <Button size="sm" onClick={() => setShowAnnouncementForm((v) => !v)}>
              {showAnnouncementForm ? 'Hide Form' : 'New Announcement'}
            </Button>
          </div>
          {showAnnouncementForm ? (
            <AnnouncementForm
              isPending={createAnnouncement.isPending}
              onSubmit={async (payload) => {
                await createAnnouncement.mutateAsync({ ...payload, targetAudience: 'team' });
                setShowAnnouncementForm(false);
              }}
              onCancel={() => setShowAnnouncementForm(false)}
            />
          ) : null}
          <DataTable
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'priority', header: 'Priority' },
              { key: 'status', header: 'Status' },
              {
                key: 'publishedAt',
                header: 'Published',
                render: (row) => (row.publishedAt ? new Date(row.publishedAt).toLocaleString() : 'Draft'),
              },
            ]}
            data={announcements?.items ?? []}
            isLoading={announcementsLoading}
            emptyMessage="No team announcements"
          />
        </section>
      ) : null}

      {activeTab === 'Team Channels' ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Team Channels</h2>
            <Button size="sm" onClick={() => setShowChannelForm((v) => !v)}>
              {showChannelForm ? 'Hide Form' : 'Create Channel'}
            </Button>
          </div>
          {showChannelForm ? (
            <ChannelForm
              isPending={createChannel.isPending}
              onSubmit={async (payload) => {
                await createChannel.mutateAsync({ ...payload, channelSubtype: 'team', participantIds: payload.participantIds ?? [] });
                setShowChannelForm(false);
              }}
              onCancel={() => setShowChannelForm(false)}
            />
          ) : null}
          <DataTable
            columns={[
              { key: 'title', header: 'Title', render: (row) => row.title ?? 'Untitled' },
              { key: 'channelSubtype', header: 'Type' },
              {
                key: 'participants',
                header: 'Members',
                render: (row) => row.participantIds?.length ?? 0,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void updateChannel.mutateAsync({
                          id: row.id,
                          payload: { isReadOnly: !row.isReadOnly },
                        })
                      }
                    >
                      {row.isReadOnly ? 'Unmoderate' : 'Moderate'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void deleteChannel.mutateAsync(row.id)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={channels?.items ?? []}
            isLoading={channelsLoading}
            emptyMessage="No team channels"
          />
        </section>
      ) : null}

      {activeTab === 'Team Read Status' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Team Read Status</h2>
          <DataTable
            columns={[
              { key: 'title', header: 'Announcement' },
              { key: 'priority', header: 'Priority' },
              {
                key: 'isAcknowledged',
                header: 'Acknowledged',
                render: (row) => (row.isAcknowledged ? 'Yes' : 'No'),
              },
              {
                key: 'isRead',
                header: 'Read',
                render: (row) => (row.isRead ? 'Yes' : 'No'),
              },
            ]}
            data={announcements?.items ?? []}
            isLoading={announcementsLoading}
            emptyMessage="No read status data"
          />
        </section>
      ) : null}
    </div>
  );
}
