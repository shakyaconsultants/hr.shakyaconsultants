import { useEffect, useRef } from 'react';
import type { Message } from '@/features/communication/api/communication.api';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { Loading } from '@/shared/components/loading';
import { cn } from '@/shared/utils/cn';

interface MessageThreadProps {
  messages: Message[];
  currentUserId?: string;
  currentUserIds?: string[];
  currentUserName?: string;
  senderNameMap?: Map<string, string>;
  isLoading?: boolean;
  readOnly?: boolean;
  showSenderInGroup?: boolean;
  className?: string;
}

function resolveSenderLabel(
  message: Message,
  senderNameMap: Map<string, string> | undefined,
): string {
  if (message.senderName) {
    return message.senderName;
  }
  return senderNameMap?.get(message.senderId) ?? message.senderName ?? 'Administrator';
}

export function MessageThread({
  messages,
  currentUserId,
  currentUserIds,
  currentUserName,
  senderNameMap,
  isLoading,
  showSenderInGroup = true,
  className,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const ownIds = currentUserIds ?? (currentUserId ? [currentUserId] : []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <Loading message="Loading messages..." />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex flex-1 items-center justify-center p-6', className)}>
        <EmptyState
          title="No messages yet"
          description="Say hello — your message will appear here."
        />
      </div>
    );
  }

  const ordered = [...messages].sort(
    (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );

  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-1.5 overflow-y-auto bg-[#0b141a] p-4 dark:bg-[#0b141a]',
        className,
      )}
    >
      {ordered.map((message) => {
        const isOwn = ownIds.includes(message.senderId);
        const senderName = resolveSenderLabel(message, senderNameMap);
        const timeLabel = message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        return (
          <div
            key={message.id}
            className={cn('flex w-full px-1', isOwn ? 'justify-end' : 'justify-start')}
          >
            <div className={cn('max-w-[min(78%,420px)]', isOwn ? 'items-end' : 'items-start')}>
              {!isOwn && showSenderInGroup ? (
                <p className="mb-1 px-1 text-xs font-medium text-emerald-400">{senderName}</p>
              ) : null}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 shadow-sm',
                  isOwn
                    ? 'rounded-tr-none bg-[#005c4b] text-white'
                    : 'rounded-tl-none bg-[#202c33] text-[#e9edef]',
                )}
              >
                <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">
                  {message.content}
                </p>
                <p
                  className={cn(
                    'mt-1 text-right text-[11px]',
                    isOwn ? 'text-white/60' : 'text-[#8696a0]',
                  )}
                >
                  {timeLabel}
                  {message.isEdited ? ' · edited' : ''}
                </p>
              </div>
              {isOwn && currentUserName ? (
                <p className="mt-0.5 px-1 text-right text-[10px] text-muted-foreground">
                  {currentUserName}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
