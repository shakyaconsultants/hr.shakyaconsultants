import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone, MessageSquare, Bell, Users } from 'lucide-react';
import { ChatPanel } from '@/features/communication/components/chat-panel';
import { AnnouncementsPanel } from '@/features/communication/components/announcements-panel';
import { NotificationsPanel } from '@/features/communication/components/notifications-panel';
import { EmployeeDmOversightPanel } from '@/features/communication/components/employee-dm-oversight-panel';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/app.store';

const TABS = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    permissionsAny: ['conversation.read', 'chat.message.send'],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    permissionsAny: ['announcement.read', 'notifications.broadcast'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    permissionsAny: ['notification.read'],
  },
  {
    id: 'employee-dms',
    label: 'Employee DMs',
    icon: Users,
    permissionsAny: ['notifications.broadcast'],
  },
] as const;

type CommunicationTab = (typeof TABS)[number]['id'];

export function CommunicationHubPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as CommunicationTab | null;

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => tab.permissionsAny.some((permission) => hasPermission(permission))),
    [hasPermission],
  );

  const [activeTab, setActiveTab] = useState<CommunicationTab>(
    visibleTabs.some((tab) => tab.id === requestedTab)
      ? (requestedTab as CommunicationTab)
      : (visibleTabs[0]?.id ?? 'chat'),
  );

  function selectTab(tab: CommunicationTab) {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MessageSquare className="h-6 w-6 text-primary" />}
        title="Communication"
        description="Chat with colleagues, read announcements, and manage notifications."
        breadcrumbs={[{ label: 'Communication' }]}
      />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => selectTab(tab.id)}
              className="rounded-b-none"
            >
              <Icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeTab === 'chat' ? <ChatPanel /> : null}
      {activeTab === 'announcements' ? <AnnouncementsPanel /> : null}
      {activeTab === 'notifications' ? <NotificationsPanel /> : null}
      {activeTab === 'employee-dms' ? <EmployeeDmOversightPanel /> : null}
    </div>
  );
}
