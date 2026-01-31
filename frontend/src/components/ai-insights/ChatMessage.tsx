import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AIMessage as AIMessageType } from '../../types/ai';
import { cn } from '../../utils/helpers';
import '../../styles/components/ai-insights.css';

/* Match site-wide motion: tween, ease [0.4, 0, 0.2, 1] */
const tweenEase = [0.4, 0, 0.2, 1] as const;
const messageTransition = { type: 'tween' as const, duration: 0.32, ease: tweenEase };

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
        'flex py-3 items-start',
        isUser ? 'justify-end' : 'justify-start',
        !isUser && '-ml-12', /* logo (36px) + gap (12px) so bubble aligns with container left */
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...messageTransition,
        duration: 0.35,
        delay: index * 0.04,
      }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-3" aria-hidden>
          <div className="neu-diamond-outer neu-diamond-outer--loading">
            <div className="neu-diamond" />
            <div className="neu-diamond neu-diamond-inner" />
          </div>
        </div>
      )}
      <motion.div
        className={cn(
          'neu-chat-bubble max-w-[85%] sm:max-w-[85%] px-4 py-2.5 text-[var(--text-sm)] leading-[var(--line-height-relaxed)]',
          isUser ? 'neu-chat-bubble--user text-right' : 'neu-chat-bubble--ai text-left'
        )}
        initial={!isUser ? { opacity: 0 } : undefined}
        animate={{ opacity: 1 }}
        transition={!isUser ? { ...messageTransition, delay: index * 0.04 + 0.05 } : { duration: 0.15 }}
        whileHover={{ scale: 1.01 }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="chat-message-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <span
          className="block mt-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)]"
        >
          {message.timestamp}
        </span>
      </motion.div>
    </motion.div>
  );
}
