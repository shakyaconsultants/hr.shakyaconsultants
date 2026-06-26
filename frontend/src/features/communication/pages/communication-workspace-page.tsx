import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, Megaphone, MessageSquare } from 'lucide-react';
import { ConversationList } from '@/features/communication/components/conversation-list';
import { MessageComposer } from '@/features/communication/components/message-composer';
import { MessageThread } from '@/features/communication/components/message-thread';
import {
  useAnnouncements,
  useChannels,
  useDirectConversations,
  useMessages,
  useSendMessage,
  useWorkspaceCommunicationDashboard,
} from '@/features/communication/hooks/use-communication';
import { WorkspaceNav, WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import type { Conversation } from '@/features/communication/api/communication.api';

const TABS = ['Direct Messages', 'Team Channels', 'Announcements', 'Mentions'] as const;

export function CommunicationWorkspacePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Direct Messages');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const user = useAuthStore((s) => s.user);

  const { data: dashboard, isLoading: dashboardLoading } = useWorkspaceCommunicationDashboard();
  const { data: directConversations, isLoading: dmLoading } = useDirectConversations({ pageSize: 50 });
  const { data: channels, isLoading: channelsLoading } = useChannels({ pageSize: 50 });
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements({ pageSize: 20 });
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedConversation?.id ?? '', { pageSize: 100 });
  const sendMessage = useSendMessage();

  const mentionMessages = (messages?.items ?? []).filter((m) => m.mentionIds && m.mentionIds.length > 0);

  if (dashboardLoading) {
    return <Loading message="Loading messages..." />;
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="Messages"
        description="Direct messages, team channels, announcements, and mentions."
      />
      <WorkspaceNav />

      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={MessageSquare} label="Unread Messages" value={dashboard.unreadMessages} />
          <StatCard icon={Megaphone} label="Unread Notifications" value={dashboard.unreadNotifications} />
          <StatCard icon={MessageSquare} label="Active Conversations" value={dashboard.activeConversations} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab(tab);
              setSelectedConversation(null);
            }}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'Direct Messages' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            {dmLoading ? (
              <Loading message="Loading conversations..." />
            ) : (
              <ConversationList
                conversations={directConversations?.items ?? []}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
                emptyMessage="No direct messages"
              />
            )}
          </div>
          <div className="rounded-lg border bg-card lg:col-span-2">
            {selectedConversation ? (
              <>
                <div className="border-b px-4 py-3 font-medium">
                  {selectedConversation.title ?? 'Direct Message'}
                </div>
                <MessageThread
                  messages={messages?.items ?? []}
                  currentUserId={user?.id}
                  isLoading={messagesLoading}
                />
                <MessageComposer
                  isPending={sendMessage.isPending}
                  onSend={async (content) => {
                    await sendMessage.mutateAsync({
                      conversationId: selectedConversation.id,
                      payload: { content },
                    });
                  }}
                />
              </>
            ) : (
              <EmptyState title="Select a conversation" description="Choose a direct message to view the thread." />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'Team Channels' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            {channelsLoading ? (
              <Loading message="Loading channels..." />
            ) : (
              <ConversationList
                conversations={channels?.items ?? []}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
                emptyMessage="No team channels"
              />
            )}
          </div>
          <div className="rounded-lg border bg-card lg:col-span-2">
            {selectedConversation ? (
              <>
                <div className="border-b px-4 py-3 font-medium">{selectedConversation.title ?? 'Channel'}</div>
                <MessageThread
                  messages={messages?.items ?? []}
                  currentUserId={user?.id}
                  isLoading={messagesLoading}
                />
                <MessageComposer
                  isPending={sendMessage.isPending}
                  disabled={selectedConversation.isReadOnly}
                  onSend={async (content) => {
                    await sendMessage.mutateAsync({
                      conversationId: selectedConversation.id,
                      payload: { content },
                    });
                  }}
                />
              </>
            ) : (
              <EmptyState title="Select a channel" description="Choose a team channel to view messages." />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'Announcements' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Company & Department Announcements</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.WORKSPACE_ANNOUNCEMENTS}>View all announcements</Link>
            </Button>
          </div>
          {announcementsLoading ? (
            <Loading message="Loading announcements..." />
          ) : (announcements?.items.length ?? 0) === 0 ? (
            <EmptyState title="No announcements" />
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {announcements?.items.map((a) => (
                <li key={a.id} className="px-4 py-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                  <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{a.priority}</span>
                    {a.isEmergency ? <span className="text-destructive">Emergency</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === 'Mentions' ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4" />
            <h2 className="font-semibold">Mentions</h2>
          </div>
          {selectedConversation && mentionMessages.length > 0 ? (
            <MessageThread messages={mentionMessages} currentUserId={user?.id} />
          ) : (
            <EmptyState
              title="No mentions"
              description="Messages where you are mentioned will appear here. Open a conversation to check for mentions."
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
