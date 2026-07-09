import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, Users, X } from 'lucide-react';
import { ConversationList } from '@/features/communication/components/conversation-list';
import { MessageComposer } from '@/features/communication/components/message-composer';
import { MessageThread } from '@/features/communication/components/message-thread';
import {
  useCompanyChat,
  useCreateDirectConversation,
  useDirectConversations,
  useMessages,
  useSendMessage,
} from '@/features/communication/hooks/use-communication';
import { useCommunicationSocket } from '@/features/communication/hooks/use-communication-socket';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { toastError } from '@/shared/feedback/toast.store';
import { useAuthStore } from '@/shared/stores/app.store';
import type { Conversation } from '@/features/communication/api/communication.api';
import {
  buildParticipantNameMap,
  getActorParticipantIds,
  getCurrentUserDisplayName,
  getInitials,
  getPeerParticipantId,
  resolveParticipantName,
} from '@/features/communication/utils/participant.util';
import { cn } from '@/shared/utils/cn';

type ChatMode = 'everyone' | 'direct';

export function ChatPanel() {
  const employee = useAuthStore((s) => s.employee);
  const user = useAuthStore((s) => s.user);
  const actorIds = useMemo(() => getActorParticipantIds(employee, user), [employee, user]);
  const currentUserName = useMemo(
    () => getCurrentUserDisplayName(employee, user),
    [employee, user],
  );

  const [mode, setMode] = useState<ChatMode>('everyone');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const { data: companyChat, isLoading: companyLoading } = useCompanyChat();
  const { data: directConversations, isLoading: dmLoading } = useDirectConversations({
    pageSize: 50,
  });
  const { data: employees } = useAllEmployees();
  const sendMessage = useSendMessage();
  const createConversation = useCreateDirectConversation();

  const activeConversation = mode === 'everyone' ? (companyChat ?? null) : selectedConversation;

  const { data: messages, isLoading: messagesLoading } = useMessages(activeConversation?.id ?? '');

  useCommunicationSocket(activeConversation?.id);

  const participantNameMap = useMemo(() => buildParticipantNameMap(employees ?? []), [employees]);

  const employeeOptions = useMemo(
    () =>
      (employees ?? [])
        .filter((item) => !actorIds.includes(item.id))
        .map((item) => ({
          value: item.id,
          label: `${item.firstName} ${item.lastName}`.trim(),
        })),
    [employees, actorIds],
  );

  function getConversationLabel(conversation: Conversation) {
    if (conversation.peerDisplayName) return conversation.peerDisplayName;
    if (conversation.title) return conversation.title;
    const peerId = getPeerParticipantId(conversation, actorIds);
    return resolveParticipantName(peerId, participantNameMap, 'Administrator');
  }

  useEffect(() => {
    if (mode !== 'direct' || selectedConversation || dmLoading) return;
    const first = directConversations?.items?.[0];
    if (first) {
      setSelectedConversation(first);
    }
  }, [mode, selectedConversation, directConversations?.items, dmLoading]);

  async function handleStartDirectChat() {
    if (!targetEmployeeId) return;
    try {
      const conversation = await createConversation.mutateAsync(targetEmployeeId);
      setSelectedConversation(conversation);
      setTargetEmployeeId('');
      setShowNewChat(false);
      setMode('direct');
    } catch (error) {
      const parsed = parseMutationError(error);
      toastError(parsed.title, parsed.description);
    }
  }

  const chatTitle =
    mode === 'everyone'
      ? 'Everyone'
      : activeConversation
        ? getConversationLabel(activeConversation)
        : 'Messages';

  const chatSubtitle =
    mode === 'everyone'
      ? `${employees?.length ?? 0} members · company group`
      : activeConversation
        ? 'Direct message'
        : 'Select a chat';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'everyone' ? 'default' : 'outline'}
          onClick={() => {
            setMode('everyone');
            setSelectedConversation(null);
            setShowNewChat(false);
          }}
        >
          <Users className="mr-2 h-4 w-4" />
          Everyone
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'direct' ? 'default' : 'outline'}
          onClick={() => setMode('direct')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Direct messages
        </Button>
      </div>

      <div
        className={cn(
          'flex h-[min(720px,calc(100vh-260px))] min-h-[560px] overflow-hidden rounded-xl border bg-card shadow-md',
          mode === 'direct' ? 'flex-row' : 'flex-col',
        )}
      >
        {mode === 'direct' ? (
          <aside className="flex w-full max-w-[360px] shrink-0 flex-col border-r bg-muted/20 lg:w-[360px]">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="font-semibold">Chats</p>
                <p className="text-xs text-muted-foreground">Your conversations</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                onClick={() => setShowNewChat((open) => !open)}
              >
                {showNewChat ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            {showNewChat ? (
              <div className="space-y-2 border-b bg-background p-3">
                <AsyncSearchSelect
                  value={targetEmployeeId}
                  options={employeeOptions}
                  placeholder="Search colleague…"
                  onChange={setTargetEmployeeId}
                />
                <Button
                  className="w-full"
                  size="sm"
                  disabled={!targetEmployeeId || createConversation.isPending}
                  onClick={() => void handleStartDirectChat()}
                >
                  Start conversation
                </Button>
              </div>
            ) : null}

            {dmLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loading message="Loading chats…" />
              </div>
            ) : (
              <ConversationList
                conversations={directConversations?.items ?? []}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
                emptyMessage="No chats yet — start one with +"
                getLabel={getConversationLabel}
              />
            )}
          </aside>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                mode === 'everyone'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              {mode === 'everyone' ? <Users className="h-5 w-5" /> : getInitials(chatTitle)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{chatTitle}</p>
              <p className="truncate text-xs text-muted-foreground">{chatSubtitle}</p>
            </div>
          </header>

          {mode === 'everyone' && companyLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loading message="Loading company chat…" />
            </div>
          ) : mode === 'direct' && !activeConversation ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                title="Select a chat"
                description="Choose a conversation from the list or tap + to message a colleague."
              />
            </div>
          ) : (
            <>
              <MessageThread
                messages={messages?.items ?? []}
                currentUserIds={actorIds}
                currentUserName={currentUserName}
                senderNameMap={participantNameMap}
                isLoading={messagesLoading}
                showSenderInGroup={mode === 'everyone'}
              />
              {activeConversation ? (
                <MessageComposer
                  isPending={sendMessage.isPending}
                  placeholder={mode === 'everyone' ? 'Message everyone…' : 'Type a message…'}
                  onSend={async (content) => {
                    try {
                      await sendMessage.mutateAsync({
                        conversationId: activeConversation.id,
                        payload: { content },
                      });
                    } catch (error) {
                      const parsed = parseMutationError(error);
                      toastError(parsed.title, parsed.description);
                      throw error;
                    }
                  }}
                />
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
