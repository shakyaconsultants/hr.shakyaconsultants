import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  isPending?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  isPending,
  placeholder = 'Type a message…',
  disabled,
}: MessageComposerProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    await onSend(trimmed);
    setContent('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit(event as unknown as FormEvent);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex items-end gap-2 border-t border-border/50 bg-[#202c33] p-3"
    >
      <textarea
        className="min-h-[44px] max-h-32 flex-1 resize-none rounded-lg border-0 bg-[#2a3942] px-4 py-2.5 text-sm text-[#e9edef] placeholder:text-[#8696a0] focus:outline-none focus:ring-2 focus:ring-primary/40"
        rows={1}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isPending}
      />
      <Button
        type="submit"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full"
        disabled={disabled || isPending || !content.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
