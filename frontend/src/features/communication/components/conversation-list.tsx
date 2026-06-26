import type { Conversation } from '@/features/communication/api/communication.api';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { cn } from '@/shared/utils/cn';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  emptyMessage?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  emptyMessage = 'No conversations yet',
}: ConversationListProps) {
  if (conversations.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <button
            type="button"
            onClick={() => onSelect(conversation)}
            className={cn(
              'flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50',
              selectedId === conversation.id && 'bg-primary/5',
            )}
          >
            <span className="font-medium">{conversation.title ?? 'Direct Message'}</span>
            {conversation.channelSubtype ? (
              <span className="text-xs text-muted-foreground capitalize">{conversation.channelSubtype.replace(/_/g, ' ')}</span>
            ) : null}
            {conversation.lastMessageAt ? (
              <span className="text-xs text-muted-foreground">
                {new Date(conversation.lastMessageAt).toLocaleString()}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
