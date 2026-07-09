import type { Conversation } from '@/features/communication/api/communication.api';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { getInitials } from '@/features/communication/utils/participant.util';
import { cn } from '@/shared/utils/cn';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  emptyMessage?: string;
  getLabel?: (conversation: Conversation) => string;
  getPreview?: (conversation: Conversation) => string | undefined;
}

function formatRelativeTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  emptyMessage = 'No conversations yet',
  getLabel,
  getPreview,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const label = getLabel
          ? getLabel(conversation)
          : (conversation.peerDisplayName ?? conversation.title ?? 'Chat');
        const preview =
          getPreview?.(conversation) ?? conversation.lastMessagePreview ?? 'No messages yet';
        const isSelected = selectedId === conversation.id;

        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/60',
                isSelected && 'bg-primary/10 hover:bg-primary/10',
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                {getInitials(label)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold">{label}</span>
                  {conversation.lastMessageAt ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {preview}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
