import { useState, useCallback } from 'react';
import type { AIMessage } from '../types/ai';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Call the backend chat endpoint */
async function fetchChatResponse(message: string, conversationId?: string): Promise<{ content: string; conversationId?: string }> {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    content: data.message?.content || 'No response',
    conversationId: data.conversation_id,
  };
}

export function useAIQuery() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

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
      const { content: reply, conversationId: newConvId } = await fetchChatResponse(trimmed, conversationId);
      if (newConvId) setConversationId(newConvId);

      const assistantMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setLoading(false);
    }
  }, [conversationId]);

  const newChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setLoading(false);
  }, []);

  return { messages, loading, sendQuery, newChat };
}
