import { motion } from 'framer-motion';
import type { AIMessage as AIMessageType } from '../../types/ai';
import { cn } from '../../utils/helpers';
import '../../styles/components/ai-insights.css';

interface ChatMessageProps {
  message: AIMessageType;
  className?: string;
  index?: number;
}

export function ChatMessage({ message, className, index = 0 }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={cn(
        'flex py-3',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <motion.div
        className={cn(
          'neu-chat-bubble max-w-[85%] sm:max-w-[85%] px-4 py-2.5 text-[var(--text-sm)] leading-[var(--line-height-relaxed)]',
          isUser ? 'neu-chat-bubble--user text-right' : 'neu-chat-bubble--ai text-left'
        )}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className="block mt-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)]"
        >
          {message.timestamp}
        </span>
      </motion.div>
    </motion.div>
  );
}
