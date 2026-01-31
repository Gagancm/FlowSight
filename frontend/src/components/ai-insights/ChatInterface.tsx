import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { useAIQuery } from '../../hooks/useAIQuery';
import { cn } from '../../utils/helpers';
import {
  AnimatedSendIcon,
  AnimatedAttachIcon,
  AnimatedBranchIcon,
  AnimatedDocIcon,
  AnimatedChartIcon,
} from '../shared/AnimatedIcons';
import '../../styles/components/ai-insights.css';
import '../../styles/components/icons.css';

const QUICK_ACTIONS = [
  { id: 'blocked', label: 'Why is Feature 1 blocked?', icon: 'branch', highlighted: false },
  { id: 'review', label: 'Who should review PR #247?', icon: 'doc', highlighted: false },
  { id: 'reviews', label: 'Summarize open reviews for me', icon: 'chart', highlighted: true },
];

export function ChatInterface() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendQuery } = useAIQuery();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    sendQuery(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0 || loading;

  /* Claude-like layout: full-height chat with input pinned to bottom */
  if (hasMessages) {
    return (
      <motion.div
        className="flex flex-col h-full min-h-0"
        style={{ fontFamily: 'var(--font-sans)' }}
        initial={false}
        animate={{ opacity: 1 }}
      >
        {/* Messages area - same width/position as input panel for alignment */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible chat-messages-container flex justify-center">
          <div className="w-full max-w-3xl py-6 sm:py-8" style={{ marginLeft: 'var(--ai-chat-center-offset)' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id} message={msg} index={i} />
              ))}
              {(() => {
                const lastMessage = messages[messages.length - 1];
                const waitingForReply = loading && (messages.length === 0 || lastMessage?.role === 'user');
                if (!waitingForReply) return null;
                const hasAssistantMessage = messages.some((m) => m.role === 'assistant');
                return (
                  <motion.div
                    key="loading-row"
                    className="flex justify-start items-start py-3 -ml-12"
                    aria-label="AI is responding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { type: 'tween', duration: 0.18, ease: [0.4, 0, 0.2, 1] } }}
                    transition={{ type: 'tween', duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {hasAssistantMessage ? (
                      <div className="flex-shrink-0 mr-3 w-9" aria-hidden />
                    ) : (
                      <div className="flex-shrink-0 mr-3" aria-hidden>
                        <div className="neu-diamond-outer neu-diamond-outer--loading">
                          <div className="neu-diamond" />
                          <div className="neu-diamond neu-diamond-inner" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>
        </div>

        {/* Input area - pinned to bottom so chat input bottom aligns with sidebar bottom */}
        <div className="flex-shrink-0 flex justify-center pt-4 pb-0 chat-input-wrapper">
          <div className="neu-chat-panel neu-chat-panel--sidebar-style w-full max-w-3xl px-4 sm:px-6" style={{ marginLeft: 'var(--ai-chat-center-offset)' }}>
            <div className="px-5 pt-5 pb-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading}
                rows={3}
                className="neu-textarea w-full px-4 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontSize: '0.875rem' }}
                aria-label="Message"
              />

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  className="neu-attach-link flex items-center gap-2"
                  style={{ fontSize: '0.875rem' }}
                >
                  <AnimatedAttachIcon />
                  <span>Attach file</span>
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="neu-btn-send w-10 h-10 flex items-center justify-center flex-shrink-0"
                  aria-label="Send"
                >
                  <AnimatedSendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* Initial state: centered greeting and quick actions */
  return (
    <motion.div
      className="flex h-full min-h-0 overflow-y-auto justify-center items-center"
      style={{ fontFamily: 'var(--font-sans)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8" style={{ marginLeft: 'var(--ai-chat-center-offset)' }}>
        {/* Soft diamond shape with orange border + inner squircle */}
        <motion.div
          className="neu-diamond-outer flex-shrink-0 mb-6"
          aria-hidden
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="neu-diamond" />
          <div className="neu-diamond neu-diamond-inner" />
        </motion.div>

        {/* Greeting */}
        <motion.h2
          className="text-center text-[var(--color-text-primary)] font-semibold mb-6 sm:mb-8"
          style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Hi, let&apos;s explore your workflow
        </motion.h2>

        {/* Main chat card - starts conversation */}
        <motion.div
          className="neu-chat-panel w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="px-5 pt-5 pb-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={loading}
              rows={3}
              className="neu-textarea w-full px-4 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontSize: '0.875rem' }}
              aria-label="Message"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                className="neu-attach-link flex items-center gap-2"
                style={{ fontSize: '0.875rem' }}
              >
                <AnimatedAttachIcon />
                <span>Attach file</span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="neu-btn-send w-10 h-10 flex items-center justify-center flex-shrink-0"
                aria-label="Send"
              >
                <AnimatedSendIcon />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full mt-6 sm:mt-8">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon =
              action.icon === 'branch'
                ? AnimatedBranchIcon
                : action.icon === 'doc'
                  ? AnimatedDocIcon
                  : AnimatedChartIcon;
            return (
              <motion.button
                key={action.id}
                type="button"
                onClick={() => sendQuery(action.label)}
                className={cn(
                  'neu-quick-action flex items-center gap-3 px-4 py-4 text-left',
                  action.highlighted && 'neu-quick-action--highlighted'
                )}
                style={{ fontSize: '0.875rem' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06, duration: 0.25 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon />
                <span className="min-w-0">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
