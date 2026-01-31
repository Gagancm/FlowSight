import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { useAIQuery } from '../../hooks/useAIQuery';
import { cn } from '../../utils/helpers';
import '../../styles/components/ai-insights.css';

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
      <div
        className="flex flex-col h-full min-h-0"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {/* Messages area - scrollable, fills space */}
        <div className="flex-1 min-h-0 overflow-y-auto chat-messages-container flex justify-center">
          <div className="w-full max-w-3xl px-6 py-8" style={{ marginLeft: 'var(--ai-chat-center-offset)' }}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex justify-start py-3" aria-label="AI is thinking">
                <div className="neu-diamond-outer neu-diamond-outer--loading flex-shrink-0" aria-hidden>
                  <div className="neu-diamond" />
                  <div className="neu-diamond neu-diamond-inner" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area - fixed at bottom, sidebar-style panel */}
        <div className="flex-shrink-0 flex justify-center pb-8 pt-4 chat-input-wrapper">
          <div className="neu-chat-panel neu-chat-panel--sidebar-style w-full max-w-3xl px-6" style={{ marginLeft: 'var(--ai-chat-center-offset)' }}>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span>Attach file</span>
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="neu-btn-send w-10 h-10 flex items-center justify-center flex-shrink-0"
                  aria-label="Send"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Initial state: centered greeting and quick actions */
  return (
    <div
      className="flex h-full min-h-0 overflow-y-auto justify-center items-center"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-3xl px-6 py-8" style={{ marginLeft: 'var(--ai-chat-center-offset)' }}>
        {/* Soft diamond shape with orange border + inner squircle (rotates on hover) */}
        <div className="neu-diamond-outer flex-shrink-0 mb-6" aria-hidden>
          <div className="neu-diamond" />
          <div className="neu-diamond neu-diamond-inner" />
        </div>

        {/* Greeting */}
        <h2
          className="text-center text-[var(--color-text-primary)] font-semibold mb-8"
          style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}
        >
          Hi, let&apos;s explore your workflow
        </h2>

        {/* Main chat card - starts conversation */}
        <div className="neu-chat-panel w-full">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Attach file</span>
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="neu-btn-send w-10 h-10 flex items-center justify-center flex-shrink-0"
                aria-label="Send"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8">
          {QUICK_ACTIONS.map((action) => {
            const Icon =
              action.icon === 'branch'
                ? () => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#8b8d93]" aria-hidden>
                      <line x1="6" y1="3" x2="6" y2="15" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M6 9a9 9 0 0 1 9 9" />
                    </svg>
                  )
                : action.icon === 'doc'
                  ? () => (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#8b8d93]" aria-hidden>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    )
                  : () => (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#8b8d93]" aria-hidden>
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
                  'neu-quick-action flex items-center gap-3 px-4 py-4 text-left',
                  action.highlighted && 'neu-quick-action--highlighted'
                )}
                style={{ fontSize: '0.875rem' }}
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
