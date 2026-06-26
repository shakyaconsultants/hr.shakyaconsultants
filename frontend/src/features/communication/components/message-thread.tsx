import { useEffect, useRef } from 'react';
import type { Message } from '@/features/communication/api/communication.api';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { Loading } from '@/shared/components/loading';

interface MessageThreadProps {
  messages: Message[];
  currentUserId?: string;
  isLoading?: boolean;
}

export function MessageThread({ messages, currentUserId, isLoading }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return <Loading message="Loading messages..." />;
  }

  if (messages.length === 0) {
    return <EmptyState title="No messages yet" description="Send a message to start the conversation." />;
  }

  return (
    <div className="flex max-h-[480px] flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => {
        const isOwn = currentUserId && message.senderId === currentUserId;
        return (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              isOwn ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <p className={`mt-1 text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}
              {message.isEdited ? ' (edited)' : ''}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
