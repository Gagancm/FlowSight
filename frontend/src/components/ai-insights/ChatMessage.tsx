import type { AIMessage as AIMessageType } from '../../types/ai';
import { cn } from '../../utils/helpers';
import '../../styles/components/ai-insights.css';

interface ChatMessageProps {
  message: AIMessageType;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex py-3',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'neu-chat-bubble max-w-[85%] px-4 py-2.5 text-[var(--text-sm)] leading-[var(--line-height-relaxed)]',
          isUser ? 'neu-chat-bubble--user text-right' : 'neu-chat-bubble--ai text-left'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className="block mt-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)]"
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
