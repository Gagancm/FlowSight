import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { useAIQuery } from '../../hooks/useAIQuery';
import { cn } from '../../utils/helpers';
import {
  AnimatedSendIcon,
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
  const { messages, loading, sendQuery, connectionsContext, setConnectionsContext } = useAIQuery();
  const [showContextModal, setShowContextModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [contextStep, setContextStep] = useState<'project' | 'type'>('project');

  // Show imported context info
  const contextInfo = connectionsContext && connectionsContext.tools.length > 0
    ? { name: connectionsContext.projectName, tools: connectionsContext.tools.length, connections: connectionsContext.edges.length }
    : null;

  // Load projects from localStorage (same key as ConnectionsPage uses)
  const [projects] = useState(() => {
    try {
      const raw = localStorage.getItem('flowsight-connections-projects');
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  const handleOpenContextModal = () => {
    setContextStep('project');
    setSelectedProject(null);
    setShowContextModal(true);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setContextStep('type');
  };

  const handleContextTypeSelect = (type: 'connections' | 'flow') => {
    setShowContextModal(false);
    
    if (!selectedProject) return;
    
    // Find the selected project
    const project = projects.find((p: any) => p.id === selectedProject);
    if (!project) return;
    
    if (type === 'connections') {
      // Build connections context from the project data
      const idToName = new Map<string, string>();
      const tools: { id: string; name: string }[] = [];
      
      if (project.nodes) {
        for (const node of project.nodes) {
          const name = (node.data?.name as string) || (node.data?.tool as string) || node.id;
          idToName.set(node.id, name);
          tools.push({ id: node.id, name });
        }
      }
      
      const edges = (project.edges || []).map((e: any) => ({
        sourceLabel: idToName.get(e.source) ?? e.source,
        targetLabel: idToName.get(e.target) ?? e.target,
      }));
      
      const context = {
        projectId: project.id,
        projectName: project.name || 'Untitled',
        tools,
        edges,
      };
      
      // Save to sessionStorage for persistence
      try {
        sessionStorage.setItem('flowsight-ai-connections-context', JSON.stringify(context));
      } catch {}
      
      // Update state directly - no page refresh needed!
      setConnectionsContext(context);
    } else {
      // For Flow - not yet implemented
      // Close modal for now, can be implemented when Flow page has context support
      setShowContextModal(false);
    }
  };

  const handleBack = () => {
    setContextStep('project');
    setSelectedProject(null);
  };

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
              {contextInfo && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <div className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl neu-context-badge text-xs relative">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span className="font-medium text-[var(--color-text-primary)]">{contextInfo.name}</span>
                    <span className="text-[var(--color-text-muted)]">•</span>
                    <span className="text-[var(--color-text-secondary)]">{contextInfo.tools} tools, {contextInfo.connections} connections</span>
                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.removeItem('flowsight-ai-connections-context');
                        setConnectionsContext(null);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:text-red-400 text-[var(--color-text-muted)]"
                      title="Remove context"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
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
                onClick={handleOpenContextModal}
                className="neu-attach-link flex items-center gap-2"
                style={{ fontSize: '0.875rem' }}
              >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Add Context</span>
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

  /* Context selection modal */
  const ContextModal = () => (
    <AnimatePresence>
      {showContextModal && (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowContextModal(false)}
        >
          <motion.div
            className="neu-chat-panel rounded-2xl p-6 w-full max-w-md shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextStep === 'project' ? (
              <>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Select Project</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Choose a project to import its context into the chat.
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                      <p className="text-sm">No projects found.</p>
                      <p className="text-xs mt-2">Create a project in Connections or Flow first.</p>
                    </div>
                  ) : (
                    projects.map((project: any) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleProjectSelect(project.id)}
                        className="neu-quick-action w-full flex items-center gap-3 px-4 py-4 text-left"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--color-text-primary)]">{project.name || 'Untitled'}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {project.nodes?.length || 0} tools, {project.edges?.length || 0} connections
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowContextModal(false)}
                  className="mt-6 w-full py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Choose Context Type</h3>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Import data from Connections or Flow for the selected project.
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleContextTypeSelect('connections')}
                    className="neu-quick-action w-full flex items-center gap-3 px-4 py-4 text-left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--color-text-primary)]">Connections</div>
                      <div className="text-xs text-[var(--color-text-muted)]">Import tool connections and integrations</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleContextTypeSelect('flow')}
                    className="neu-quick-action w-full flex items-center gap-3 px-4 py-4 text-left opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--color-text-primary)]">Flow</div>
                      <div className="text-xs text-[var(--color-text-muted)]">Coming soon</div>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowContextModal(false)}
                  className="mt-6 w-full py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* Initial state: centered greeting and quick actions */
  return (
    <>
      <ContextModal />
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
            {contextInfo && (
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl neu-context-badge text-xs relative">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span className="font-medium text-[var(--color-text-primary)]">{contextInfo.name}</span>
                  <span className="text-[var(--color-text-muted)]">•</span>
                  <span className="text-[var(--color-text-secondary)]">{contextInfo.tools} tools, {contextInfo.connections} connections</span>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem('flowsight-ai-connections-context');
                      setConnectionsContext(null);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:text-red-400 text-[var(--color-text-muted)]"
                    title="Remove context"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
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
                onClick={handleOpenContextModal}
                className="neu-attach-link flex items-center gap-2"
                style={{ fontSize: '0.875rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Add Context</span>
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
    </>
  );
}
