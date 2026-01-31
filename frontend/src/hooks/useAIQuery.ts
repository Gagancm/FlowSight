import { useState, useCallback } from 'react';
import type { AIMessage } from '../types/ai';

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Mock assistant reply for demo until watsonx Orchestrate is wired. */
async function mockAssistantReply(userMessage: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  const lower = userMessage.toLowerCase();
  if (lower.includes('blocked') || lower.includes('block'))
    return "I'll check the workflow. Blocked items usually have a dependency or missing approval. I can suggest unblocking steps if you share the branch or PR ID.";
  if (lower.includes('review') || lower.includes('pr'))
    return "Based on code ownership and recent changes, I recommend adding a reviewer from the team that last touched this area. I can list suggested reviewers if you share the repo and PR number.";
  if (lower.includes('merge') || lower.includes('conflict'))
    return "I can analyze merge order and conflicts. Merge conflicts often come from parallel changes to the same files; merging in dependency order usually helps.";
  return "Thanks for your message. I'm here to help with workflow questions, branch status, reviews, and merge decisions. Ask something like \"Why is Feature X blocked?\" or \"Who should review PR #247?\" and I'll dig in.";
}

export function useAIQuery() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendQuery = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const reply = await mockAssistantReply(trimmed);
      const assistantMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setLoading(false);
  }, []);

  return { messages, loading, sendQuery, newChat };
}
