import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { fetchEmployeeDirectConversations, fetchMessages } from '@/features/communication/api/communication.api';
import { MessageThread } from '@/features/communication/components/message-thread';
import { ConversationList } from '@/features/communication/components/conversation-list';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import type { Conversation } from '@/features/communication/api/communication.api';

interface EmployeeMessagesPanelProps {
  employeeId: string;
}

export function EmployeeMessagesPanel({ employeeId }: EmployeeMessagesPanelProps) {
  const [selected, setSelected] = useState<Conversation | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['communication', 'employee-conversations', employeeId],
    queryFn: () => fetchEmployeeDirectConversations(employeeId, { pageSize: 50 }),
    enabled: Boolean(employeeId),
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['communication', 'messages', selected?.id],
    queryFn: () => fetchMessages(selected!.id, { pageSize: 100 }),
    enabled: Boolean(selected?.id),
  });

  if (isLoading) {
    return <Loading message="Loading conversations..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Admin view of direct message conversations for this employee.
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ConversationList
          conversations={conversations?.items ?? []}
          selectedId={selected?.id}
          onSelect={setSelected}
          emptyMessage="No direct message conversations"
          getLabel={(c) => c.title ?? `Conversation (${c.participantIds.length} participants)`}
        />
        <div className="rounded-lg border bg-card lg:col-span-2">
          {selected ? (
            <>
              <div className="border-b px-4 py-3 font-medium">
                {selected.title ?? 'Direct Message Thread'}
              </div>
              <MessageThread messages={messages?.items ?? []} isLoading={messagesLoading} />
            </>
          ) : (
            <EmptyState title="Select a conversation" description="Choose a thread to review messages." />
          )}
        </div>
      </div>
    </div>
  );
}
