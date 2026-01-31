import type { AIMessage as AIMessageType } from '../../types/ai';
import { Avatar } from '../shared/Avatar';
import { cn } from '../../utils/helpers';

interface ChatMessageProps {
  message: AIMessageType;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 py-3 px-1',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Avatar
          name={isUser ? 'You' : 'AI'}
          size="sm"
          className={!isUser ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]' : undefined}
        />
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-[var(--card-border-radius-sm)] px-4 py-2.5 text-[var(--text-sm)] leading-[var(--line-height-relaxed)]',
          isUser
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className={cn(
            'block mt-1.5 text-[var(--text-xs)]',
            isUser ? 'text-white/80' : 'text-[var(--color-text-muted)]'
          )}
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
