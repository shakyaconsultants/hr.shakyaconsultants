import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  isPending?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageComposer({ onSend, isPending, placeholder = 'Type a message...', disabled }: MessageComposerProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    await onSend(trimmed);
    setContent('');
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2 border-t bg-card p-4">
      <input
        className="flex-1 rounded-md border px-3 py-2 text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isPending}
      />
      <Button type="submit" size="sm" disabled={disabled || isPending || !content.trim()}>
        <Send className="mr-1 h-4 w-4" />
        {isPending ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
}
