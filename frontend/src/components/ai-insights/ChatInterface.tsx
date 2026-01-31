import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { useAIQuery } from '../../hooks/useAIQuery';
import { cn } from '../../utils/helpers';

const QUICK_ACTIONS = [
  { id: 'blocked', label: 'Why is Feature 1 blocked?', icon: 'branch', highlighted: false },
  { id: 'review', label: 'Who should review PR #247?', icon: 'doc', highlighted: false },
  { id: 'reviews', label: 'Summarize open reviews for me', icon: 'chart', highlighted: true },
];

function formatLastMessageLine(timestamp: string): string {
  const d = new Date();
  const dateStr = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  return `Last message sent on ${dateStr} at ${timestamp}`;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendQuery } = useAIQuery();

  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const lastMessageLabel = lastUserMessage
    ? formatLastMessageLine(lastUserMessage.timestamp)
    : null;

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

  return (
    <div
      className="flex h-full min-h-0 bg-[var(--color-bg-primary)] overflow-y-auto justify-center items-center"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-6 py-8">
        {/* Gradient circle */}
        <div
          className="w-20 h-20 rounded-full flex-shrink-0 mb-6"
          style={{
            background: 'var(--gradient-accent)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
          }}
          aria-hidden
        />

        {/* Greeting */}
        <h2
          className="text-center text-[var(--color-text-primary)] font-semibold mb-8"
          style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}
        >
          Hi, let&apos;s explore your workflow
        </h2>

        {/* Message thread (when there are messages) */}
        {hasMessages && (
          <div className="w-full mb-6 max-h-[280px] overflow-y-auto rounded-[var(--card-border-radius)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-md)]">
            <div className="p-4 space-y-0">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex gap-3 py-3 px-1">
                  <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-[var(--color-accent-bg)] flex items-center justify-center text-[var(--color-accent)] text-xs font-medium">
                    AI
                  </div>
                  <div className="rounded-[var(--card-border-radius-sm)] px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-pulse" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-pulse" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Main chat card */}
        <div
          className={cn(
            'w-full rounded-[var(--card-border-radius)] border bg-[var(--color-bg-secondary)] shadow-[var(--shadow-lg)]',
            'border-[var(--color-border)]'
          )}
        >
          {/* Last message indicator */}
          {lastMessageLabel && (
            <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{lastMessageLabel}</span>
            </div>
          )}
          {!lastMessageLabel && (
            <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-sm)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Start a conversation</span>
            </div>
          )}

          {/* Textarea */}
          <div className="px-4 pb-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue conversation..."
              disabled={loading}
              rows={3}
              className={cn(
                'w-full rounded-[var(--input-border-radius)] border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 resize-none',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                'focus:border-[var(--color-accent)] focus:outline-none',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
              style={{ fontSize: 'var(--text-sm)' }}
              aria-label="Message"
            />

            {/* Bottom row: Attach + Send */}
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                className="flex items-center gap-2 text-[var(--color-link)] hover:text-[var(--color-link-hover)] transition-colors"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Attach file</span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ background: 'var(--gradient-accent)', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)' }}
                aria-label="Send"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon =
              action.icon === 'branch'
                ? () => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[var(--color-text-muted)]" aria-hidden>
                      <line x1="6" y1="3" x2="6" y2="15" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M6 9a9 9 0 0 1 9 9" />
                    </svg>
                  )
                : action.icon === 'doc'
                  ? () => (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[var(--color-text-muted)]" aria-hidden>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    )
                  : () => (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[var(--color-text-muted)]" aria-hidden>
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    );
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => sendQuery(action.label)}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--card-border-radius-sm)] border bg-[var(--color-bg-secondary)] px-4 py-3.5 text-left transition-colors',
                  'border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]',
                  'text-[var(--color-text-primary)]',
                  action.highlighted && 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                )}
                style={{ fontSize: 'var(--text-sm)' }}
              >
                <Icon />
                <span className="min-w-0">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
