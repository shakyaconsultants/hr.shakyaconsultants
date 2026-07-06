import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus } from 'lucide-react';
import {
  createDirectConversation,
  fetchDirectConversations,
  fetchEmployeeDirectConversations,
  fetchMessages,
} from '@/features/communication/api/communication.api';
import { ConversationList } from '@/features/communication/components/conversation-list';
import { MessageComposer } from '@/features/communication/components/message-composer';
import { MessageThread } from '@/features/communication/components/message-thread';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { useSendMessage } from '@/features/communication/hooks/use-communication';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/app.store';
import type { Conversation } from '@/features/communication/api/communication.api';

export function AdminDirectMessagesPanel() {
  const user = useAuthStore((s) => s.user);
  const employee = useAuthStore((s) => s.employee);
  const currentActorId = employee?.id ?? user?.id ?? '';

  const [viewMode, setViewMode] = useState<'mine' | 'employee'>('mine');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newTargetEmployeeId, setNewTargetEmployeeId] = useState('');

  const { data: employees } = useAllEmployees();
  const sendMessage = useSendMessage();

  const employeeOptions = useMemo(
    () =>
      (employees ?? []).map((item) => ({
        value: item.id,
        label: `${item.firstName} ${item.lastName}`.trim(),
      })),
    [employees],
  );

  const employeeNameMap = useMemo(
    () => new Map(employeeOptions.map((item) => [item.value, item.label])),
    [employeeOptions],
  );

  const { data: myConversations, isLoading: myLoading } = useQuery({
    queryKey: ['communication', 'admin-dm', 'mine'],
    queryFn: () => fetchDirectConversations({ pageSize: 50 }),
  });

  const { data: employeeConversations, isLoading: employeeLoading } = useQuery({
    queryKey: ['communication', 'admin-dm', 'employee', selectedEmployeeId],
    queryFn: () => fetchEmployeeDirectConversations(selectedEmployeeId, { pageSize: 50 }),
    enabled: viewMode === 'employee' && Boolean(selectedEmployeeId),
  });

  const conversations =
    viewMode === 'mine' ? (myConversations?.items ?? []) : (employeeConversations?.items ?? []);

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['communication', 'admin-dm', 'messages', selectedConversation?.id],
    queryFn: () => fetchMessages(selectedConversation!.id, { pageSize: 100 }),
    enabled: Boolean(selectedConversation?.id),
  });

  function getConversationLabel(conversation: Conversation) {
    if (conversation.title) return conversation.title;
    const peerId = conversation.participantIds.find((id) => id !== currentActorId);
    return peerId ? (employeeNameMap.get(peerId) ?? 'Direct Message') : 'Direct Message';
  }

  async function handleStartConversation() {
    if (!newTargetEmployeeId) return;
    const conversation = await createDirectConversation(newTargetEmployeeId);
    setSelectedConversation(conversation);
    setViewMode('mine');
    setNewTargetEmployeeId('');
  }

  const canSend =
    viewMode === 'mine' &&
    selectedConversation &&
    selectedConversation.participantIds.includes(currentActorId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'mine' ? 'default' : 'outline'}
          onClick={() => {
            setViewMode('mine');
            setSelectedConversation(null);
          }}
        >
          My conversations
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'employee' ? 'default' : 'outline'}
          onClick={() => {
            setViewMode('employee');
            setSelectedConversation(null);
          }}
        >
          Review employee DMs
        </Button>
      </div>

      {viewMode === 'mine' ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
          <div className="min-w-[280px] flex-1">
            <p className="mb-2 text-sm font-medium">Message an employee</p>
            <AsyncSearchSelect
              value={newTargetEmployeeId}
              options={employeeOptions}
              placeholder="Search employee…"
              onChange={setNewTargetEmployeeId}
            />
          </div>
          <Button disabled={!newTargetEmployeeId} onClick={() => void handleStartConversation()}>
            <Plus className="mr-2 h-4 w-4" />
            Start conversation
          </Button>
        </div>
      ) : (
        <div className="max-w-md">
          <p className="mb-2 text-sm font-medium">
            Select employee to review their direct messages
          </p>
          <AsyncSearchSelect
            value={selectedEmployeeId}
            options={employeeOptions}
            placeholder="Search employee…"
            onChange={(id) => {
              setSelectedEmployeeId(id);
              setSelectedConversation(null);
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        {viewMode === 'mine'
          ? 'Send and receive direct messages with employees.'
          : 'Read-only oversight of an employee’s direct message threads.'}
      </div>

      {(viewMode === 'mine' ? myLoading : employeeLoading) ? (
        <Loading message="Loading conversations..." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            onSelect={setSelectedConversation}
            emptyMessage={
              viewMode === 'employee' && !selectedEmployeeId
                ? 'Select an employee above'
                : 'No direct message conversations'
            }
            getLabel={getConversationLabel}
          />
          <div className="rounded-lg border bg-card lg:col-span-2">
            {selectedConversation ? (
              <>
                <div className="border-b px-4 py-3 font-medium">
                  {getConversationLabel(selectedConversation)}
                </div>
                <MessageThread
                  messages={messages?.items ?? []}
                  currentUserId={currentActorId}
                  isLoading={messagesLoading}
                />
                {canSend ? (
                  <MessageComposer
                    isPending={sendMessage.isPending}
                    onSend={async (content) => {
                      await sendMessage.mutateAsync({
                        conversationId: selectedConversation.id,
                        payload: { content },
                      });
                    }}
                  />
                ) : viewMode === 'employee' ? (
                  <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                    Admin read-only view — switch to My conversations to reply as admin.
                  </p>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Select a conversation"
                description="Choose a thread or start a new direct message."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
